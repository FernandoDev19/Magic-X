import { useEffect, useMemo, useRef, useState } from "react";
import type { CombatState } from "../types/combat-state.type";
import type { GameState } from "../types/game-state";
import type { Enemy } from "../types/enemy.type";
import type { Item } from "../types/item.type";
import type { StatusEffect } from "../types/status-effect.type";
import type { ElementLevels } from "../types/magic-element.type";
import type { Mana, Stats } from "../types/player.type";
import type { Spell } from "../types/spell.type";
import type { View } from "../types/view.type";
import type { Skill } from "../types/skills.type";
import { CombatLog, getLineStyle } from "../components/CombatLog";
import { TurnOrderBar } from "../components/TurnOrderBar";
import { EnemyArt } from "../components/EnemyArt";
import { Portrait } from "../components/Portrait";
import { BACKGROUNDS, USE_IMAGES } from "../data/visuals";
import {
  allEnemiesDead,
  canCast,
  castAbilityArea,
  castAbilitySingle,
  getEffectiveCost,
} from "../utils/combat";
import { beginCombat, endPlayerTurn, getTargetIdx, type Outcome } from "../utils/turns";
import { getEffectiveStats } from "../utils/equipment";
import { resolveLoot, mergeLootIntoInventory } from "../utils/loot";
import { getSanityEffects } from "../utils/mental-effects";
import { gainXp } from "../utils/leveling";
import { announceLevelUps } from "../utils/level-up-ui";
import { SpellCircle } from "../components/SpellCircle";
import { getKnownRecipes, type ForgeContext, type ForgedSpell } from "../utils/spell-forge";
import type { SpellRecipe } from "../types/rune.type";

interface Props {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  setGameOver: (gameOver: boolean) => void;
  setCombatResult: (result: "victory" | "defeat" | null) => void;
  setView: (view: View) => void;
  combat: CombatState;
  spells: Spell[];
  skills: Skill[];
  items: Item[];
  stats: Stats;
  mana: Mana;
}

const ELEMENT_ICON: Record<string, string> = {
  fire: "🔥", earth: "🪨", water: "💧", air: "🌪",
  light: "✨", darkness: "🌑", electric: "⚡", vital: "💛",
};

const MANA_COLOR: Record<string, string> = {
  mana: "#378ADD",
  celestial: "#FAC775",
  infernal: "#E24B4A",
};

const EFFECT_ICON: Record<string, string> = {
  strengthened: "💪", velocitized: "💨", guarding: "🛡️", invisible: "👻",
  poisoned: "☠️", burning: "🔥", ignition: "🔥", cursed: "🩸",
  weakened: "⬇️", slowed: "🐌", frozen: "🧊", paralyzed: "⚡",
  blinded: "🙈", mana_drain: "💧",
};
const BUFFS = ["strengthened", "velocitized", "invisible", "guarding"];

/** Pon en false si prefieres que la debilidad del enemigo no se muestre */
const SHOW_WEAKNESS = true;

export const ENCOUNTERS_BY_CHAPTER: Record<string, string[]> = {
  ch1: ["bandit", "wolf"],
  ch2: ["shadow_assassin", "dark_acolyte", "fire_sprite", "water_spirit"],
  ch3: ["corrupted_knight", "storm_elemental", "air_elemental", "earth_golem"],
};

function addLog(state: GameState, ...lines: string[]): GameState {
  return { ...state, combat: { ...state.combat, log: [...state.combat.log, ...lines] } };
}

// ─── Números flotantes ─────────────────────────────────────────────────────
interface Popup { id: number; target: string; text: string; color: string }
let popupId = 0;

function snapshotHp(s: GameState): Record<string, number> {
  const m: Record<string, number> = { player: s.player.stats.hp };
  s.combat.enemies.forEach((e, i) => (m[`e${i}`] = e.hp));
  (s.player.party ?? []).forEach((c) => (m[c.id] = c.stats.hp));
  return m;
}

function diffPopups(before: GameState, after: GameState): Popup[] {
  const a = snapshotHp(before);
  const b = snapshotHp(after);
  const out: Popup[] = [];
  for (const k of Object.keys(b)) {
    if (a[k] === undefined || a[k] === b[k]) continue;
    const d = b[k] - a[k];
    out.push({ id: ++popupId, target: k, text: d > 0 ? `+${d}` : `${d}`, color: d > 0 ? "#5DCAA5" : "#ff6b6b" });
  }
  return out;
}

function Floaters({ popups }: { popups: Popup[] }) {
  return (
    <>
      {popups.map((p) => (
        <span key={p.id} style={{ ...floater, color: p.color }}>{p.text}</span>
      ))}
    </>
  );
}

function Chips({ effects }: { effects: StatusEffect[] }) {
  if (effects.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      {effects.map((e, i) => (
        <span
          key={i}
          title={`${e.type} (${e.permanent ? "∞" : `${e.duration}t`})`}
          style={{
            fontSize: 10, padding: "0 4px", borderRadius: 3, background: "#0d0d1a",
            border: `1px solid ${BUFFS.includes(e.type) ? "#5DCAA544" : "#E24B4A44"}`,
          }}
        >
          {EFFECT_ICON[e.type] ?? "✨"}
          {!e.permanent && <span style={{ fontSize: 8, color: "#888" }}>{e.duration}</span>}
        </span>
      ))}
    </div>
  );
}

function HpBar({ pct, color, h = 5, marks }: { pct: number; color: string; h?: number; marks?: { at: number; done: boolean }[] }) {
  return (
    <div style={{ height: h, background: "#0a0a14", borderRadius: h, position: "relative", border: "1px solid #ffffff10" }}>
      <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", background: color, borderRadius: h, transition: "width 0.4s" }} />
      {marks?.map((m, i) => (
        <div key={i} style={{ position: "absolute", top: -2, bottom: -2, width: 1, left: `${m.at}%`, background: m.done ? "#333" : "#ff9a3c" }} />
      ))}
    </div>
  );
}

function BattleBackdrop({ chapterId }: { chapterId: string }) {
  const [failed, setFailed] = useState(false);
  const bg = BACKGROUNDS[chapterId] ?? BACKGROUNDS.default;
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: bg.gradient }} />
      {USE_IMAGES && bg.src && !failed && (
        <img src={bg.src} alt="" onError={() => setFailed(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.55))" }} />
    </>
  );
}

// ─── Tarjetas del campo de batalla ─────────────────────────────────────────
function EnemyTile({ enemy, selected, shaking, popups, onSelect }: {
  enemy: Enemy; selected: boolean; shaking: boolean; popups: Popup[]; onSelect: () => void;
}) {
  const dead = enemy.hp <= 0;
  const boss = !!enemy.phases;
  const pct = Math.round((enemy.hp / enemy.maxHp) * 100);
  return (
    <div
      onClick={dead ? undefined : onSelect}
      style={{
        gridColumn: boss ? "1 / -1" : undefined,
        position: "relative", display: "flex", gap: 8, alignItems: "center",
        padding: "6px 8px", borderRadius: 8, cursor: dead ? "default" : "pointer",
        background: "rgba(8,8,20,0.74)",
        border: selected ? "1px solid #c9a84c" : boss ? "1px solid #ff6b0066" : "1px solid #ffffff14",
        boxShadow: selected ? "0 0 12px #c9a84c55" : "none",
        opacity: dead ? 0.3 : 1,
        filter: dead ? "grayscale(1)" : "none",
        animation: shaking ? "shake 0.35s" : undefined,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {selected && <span style={arrow}>▶</span>}
      <Floaters popups={popups} />
      <EnemyArt id={enemy.id} fallback={ELEMENT_ICON[enemy.element]} size={boss ? 64 : 44} dead={dead} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "baseline" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: dead ? "#555" : "#f08a8a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {enemy.name}
          </span>
          <span style={{ fontSize: 9, color: "#888", flexShrink: 0 }}>
            Nv{enemy.level}
            {boss && !dead && <span style={{ color: "#ff9a3c" }}> · F{(enemy.phase ?? 0) + 1}</span>}
          </span>
        </div>
        <HpBar
          pct={pct}
          color={pct > 50 ? "#E24B4A" : pct > 25 ? "#FAC775" : "#777"}
          marks={enemy.phases?.map((p, i) => ({ at: p.hpBelowPct, done: i < (enemy.phase ?? 0) }))}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3, gap: 4 }}>
          <Chips effects={enemy.statusEffects} />
          <span style={{ fontSize: 9, color: "#aaa", marginLeft: "auto" }}>{dead ? "✝" : `${enemy.hp}/${enemy.maxHp}`}</span>
        </div>
      </div>
    </div>
  );
}

interface MiniBar { label: string; value: number; max: number; color: string }

function PartyRow({ name, hp, maxHp, bars, dead, active, hit, popups, effects }: {
  name: string; portrait?: string; hp: number; maxHp: number; bars: MiniBar[];
  dead?: boolean; active?: boolean; hit?: boolean; popups: Popup[]; effects?: StatusEffect[];
}) {
  const pct = (hp / maxHp) * 100;
  return (
    <div
      style={{
        position: "relative", display: "flex", gap: 8, alignItems: "center",
        padding: "6px 8px", borderRadius: 8, background: "rgba(8,8,20,0.78)",
        border: active ? "1px solid #5DCAA5" : "1px solid #ffffff14",
        boxShadow: active ? "0 0 12px #5DCAA555" : "none",
        opacity: dead ? 0.45 : 1, filter: dead ? "grayscale(1)" : "none",
        animation: hit ? "shake 0.35s" : undefined,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      <Floaters popups={popups} />
      <Portrait name={name} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#5DCAA5" : "#ddd" }}>
            {dead ? "💀 " : ""}{name}
          </span>
          <span style={{ fontSize: 10, color: "#ccc" }}>{hp}/{maxHp}</span>
        </div>
        <HpBar pct={pct} color={pct > 50 ? "#1D9E75" : pct > 25 ? "#FAC775" : "#E24B4A"} h={6} />
        <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
          {bars.map((b) => (
            <div key={b.label} style={{ flex: 1 }} title={`${b.label} ${b.value}/${b.max}`}>
              <HpBar pct={b.max > 0 ? (b.value / b.max) * 100 : 0} color={b.color} h={3} />
            </div>
          ))}
        </div>
        {effects && effects.length > 0 && <div style={{ marginTop: 3 }}><Chips effects={effects} /></div>}
      </div>
    </div>
  );
}

// ─── Ventana de comandos ───────────────────────────────────────────────────
type Tab = "skills" | "items";

interface Info {
  title: string;
  description: string;
  cost?: string;
  costColor?: string;
  damage?: number;
  heal?: number;
  target?: string;
  effects?: string[];
}

interface Row {
  key: string;
  icon: string;
  name: string;
  tag?: string;
  right: string;
  rightColor: string;
  disabled: boolean;
  onClick: () => void;
  info: Info;
}

function MenuBtn({ icon, label, badge, active, disabled, danger, onClick, onHover }: {
  icon: string; label: string; badge?: string; active?: boolean; disabled?: boolean; danger?: boolean;
  onClick: () => void; onHover: (on: boolean) => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left",
        padding: "4px 8px", fontSize: 11, fontFamily: "Georgia, serif",
        background: active ? "#c9a84c1f" : "transparent",
        borderLeft: `3px solid ${active ? "#c9a84c" : "transparent"}`,
        borderTop: "none", borderRight: "none", borderBottom: "none",
        color: danger ? "#E24B4A" : active ? "#c9a84c" : "#ccc",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span style={{ width: 16, textAlign: "center" }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <span style={{ fontSize: 9, color: "#777" }}>{badge}</span>}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export function CombatView({
  combat, items, mana, state, skills,
  setState, setCombatResult, setView, setGameOver,
}: Props) {
  const [shakeEnemy, setShakeEnemy] = useState<number | null>(null);
  const [hitPlayer, setHitPlayer] = useState(false);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [tab, setTab] = useState<Tab>("skills");
  const [showCircle, setShowCircle] = useState(false);
  const [info, setInfo] = useState<Info | null>(null);
  const [showLog, setShowLog] = useState(false);
  const startedRef = useRef(false);

  const isPlayerTurn = combat.turn === "player";
  const targetIdx = getTargetIdx(combat);
  const targetEnemy = targetIdx >= 0 ? combat.enemies[targetIdx] : null;
  const sanityEff = getSanityEffects(state.player.stats.sanity);
  const canFlee = !state.returnTo || state.returnTo === "hub";
  const bossFight = combat.enemies.some((e) => !!e.phases && e.hp > 0);
  const partyActive = (state.player.party ?? []).filter((c) => c.isRecruited && c.isActive).slice(0, 2);
  const actor = combat.order[combat.turnIdx];
  const forgeCtx = useMemo<ForgeContext>(
    () => ({
      stats: getEffectiveStats(state.player.stats, state.player.equipment, state.player.statusEffects),
      elementLevels: state.player.elementLevels,
      elementAffinity: state.player.elementAffinity,
    }),
    [state.player.stats, state.player.equipment, state.player.statusEffects, state.player.elementLevels, state.player.elementAffinity],
  );

  function flashEnemy(idx: number) {
    setShakeEnemy(idx);
    setTimeout(() => setShakeEnemy(null), 400);
  }

  // ── Resolución de turnos ───────────────────────────────────────────────
  function settle(ns: GameState, outcome: Outcome, before: GameState) {
    const pops = diffPopups(before, ns);
    if (pops.length) {
      setPopups((p) => [...p, ...pops]);
      setTimeout(() => setPopups((p) => p.filter((x) => !pops.includes(x))), 1100);
    }
    if (ns.player.stats.hp < before.player.stats.hp) {
      setHitPlayer(true);
      setTimeout(() => setHitPlayer(false), 400);
    }
    if (outcome === "victory") return handleVictory(ns);
    setState(ns);
    if (outcome === "defeat") {
      setCombatResult("defeat");
      setGameOver(true);
    }
  }

  /** El jugador terminó su acción: actúan los demás hasta que vuelva a tocarte */
  function resolve(ns: GameState) {
    const { state: out, outcome } = endPlayerTurn(ns);
    settle(out, outcome, state);
  }

  useEffect(() => {
    if (startedRef.current || combat.order.length > 0 || combat.enemies.length === 0) return;
    startedRef.current = true;
    const { state: ns, outcome } = beginCombat(state);
    settle(ns, outcome, state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Acciones ───────────────────────────────────────────────────────────
  function physicalPreview() {
    if (!targetEnemy) return 0;
    const eff = getEffectiveStats(state.player.stats, state.player.equipment, state.player.statusEffects);
    return Math.max(1, eff.physical_strength - Math.floor(targetEnemy.resistance / 2));
  }

  function handlePhysicalAttack() {
    if (!targetEnemy || !isPlayerTurn) return;
    if (Math.random() < sanityEff.missChance) {
      return resolve(addLog(state, "Tu mente falla... el ataque se pierde en el aire."));
    }
    const dmg = physicalPreview();
    const weaponName = state.player.equipment.mainHand?.name ?? "Ataque físico";
    flashEnemy(targetIdx);

    const newEnemies = state.combat.enemies.map((e, i) =>
      i === targetIdx ? { ...e, hp: Math.max(0, e.hp - dmg) } : e,
    );
    const gain = Math.floor(dmg / 4);
    const m = state.player.mana;
    const newMana = {
      ...m,
      mana: Math.min(m.maxMana, m.mana + gain),
      celestial: Math.min(m.maxCelestial, m.celestial + Math.floor(dmg / 12)),
      infernal: Math.min(m.maxInfernal, m.infernal + Math.floor(dmg / 12)),
    };
    const lines = [`${weaponName} → ${dmg} daño a ${targetEnemy.name}.`];
    if (gain > 0) lines.push(`💧 +${gain} Maná por combate.`);

    resolve({
      ...state,
      player: { ...state.player, mana: newMana },
      combat: { ...state.combat, enemies: newEnemies, log: [...state.combat.log, ...lines] },
    });
  }

  function handleDefend() {
    if (!isPlayerTurn) return;
    const gain = 8;
    const m = state.player.mana;
    resolve(
      addLog(
        {
          ...state,
          player: {
            ...state.player,
            mana: { ...m, mana: Math.min(m.maxMana, m.mana + gain) },
            statusEffects: [
              ...state.player.statusEffects.filter((e) => e.type !== "guarding"),
              { type: "guarding", duration: 1, permanent: true },
            ],
          },
        },
        `🛡️ Te pones en guardia (+${gain} maná). Recibirás la mitad de daño hasta tu próximo turno.`,
      ),
    );
  }

  function handleCastAbility(ability: Spell | Skill) {
    if (!isPlayerTurn) return;
    if (Math.random() < sanityEff.missChance) {
      return resolve(addLog(state, "Tu mente fragmentada interrumpe el hechizo."));
    }
    const eff = getEffectiveStats(state.player.stats, state.player.equipment, state.player.statusEffects);
    const p = state.player;

    if (ability.areaEffect) {
      const r = castAbilityArea(
        ability, p.mana, p.elementAffinity, p.elementLevels, state.combat.enemies,
        p.stats, p.statusEffects, eff.magical_strength, eff.physical_strength,
      );
      if (!r.success) return setState(addLog(state, ...r.messages));
      const levels =
        "element" in ability && allEnemiesDead(r.newEnemies)
          ? grantXpToElement(p.elementLevels, ability.element, 2)
          : p.elementLevels;
      resolve({
        ...state,
        player: { ...p, stats: r.newPlayerStats, mana: r.newMana, statusEffects: r.newPlayerEffects, elementLevels: levels },
        combat: { ...state.combat, enemies: r.newEnemies, log: [...state.combat.log, ...r.messages] },
      });
      return;
    }

    if (!targetEnemy && ability.targetType !== "self") return;

    const r = castAbilitySingle(
      ability, p.mana, p.elementAffinity, p.elementLevels,
      targetEnemy ?? state.combat.enemies[0], p.stats, p.statusEffects,
      eff.magical_strength, eff.physical_strength,
    );
    if (!r.success) return setState(addLog(state, ...r.messages));
    if (ability.targetType !== "self") flashEnemy(targetIdx);

    const newEnemies = state.combat.enemies.map((e, i) => (i === targetIdx ? r.newEnemy : e));
    const levels =
      "element" in ability && allEnemiesDead(newEnemies)
        ? grantXpToElement(p.elementLevels, ability.element, 2)
        : p.elementLevels;
    resolve({
      ...state,
      player: { ...p, stats: r.newPlayerStats, mana: r.newMana, statusEffects: r.newPlayerEffects, elementLevels: levels },
      combat: { ...state.combat, enemies: newEnemies, log: [...state.combat.log, ...r.messages] },
    });
  }

  /** Lanza un hechizo forjado en el círculo mágico (runas + elementos) */
  function handleCastForged(forged: ForgedSpell) {
    if (!isPlayerTurn) return;
    setShowCircle(false);
    if (Math.random() < sanityEff.missChance) {
      return resolve(addLog(state, "Tu mente fragmentada interrumpe el hechizo."));
    }
    const eff = getEffectiveStats(state.player.stats, state.player.equipment, state.player.statusEffects);
    const p = state.player;
    const extra: string[] = [];

    // Inestabilidad: el hechizo se rebela, pierde la mitad de su fuerza y te golpea de vuelta
    let spell = forged.spell;
    const unstable = forged.instability > 0 && Math.random() < forged.instability;
    let backlash = 0;
    let sanityLoss = 0;
    if (unstable) {
      spell = {
        ...spell,
        damage: spell.damage ? Math.max(1, Math.round(spell.damage * 0.5)) : undefined,
        heal: spell.heal ? Math.max(1, Math.round(spell.heal * 0.5)) : undefined,
        effects: undefined,
        critChance: undefined,
      };
      backlash = Math.min(p.stats.hp - 1, Math.max(2, Math.round(spell.manaCost * 0.4)));
      sanityLoss = 3;
      extra.push("💥 ¡El hechizo se desestabiliza! Pierde fuerza y la magia te quema por dentro.");
    }

    if (!targetEnemy && spell.targetType === "enemy") return;
    const target = targetEnemy ?? state.combat.enemies[0];

    let newEnemies = state.combat.enemies;
    let newMana = p.mana;
    let newStats = p.stats;
    let newEffects = p.statusEffects;
    let messages: string[] = [];

    if (spell.areaEffect) {
      const r = castAbilityArea(
        spell, p.mana, p.elementAffinity, p.elementLevels, state.combat.enemies,
        p.stats, p.statusEffects, eff.magical_strength, eff.physical_strength,
      );
      if (!r.success) return setState(addLog(state, ...r.messages));
      ({ newEnemies, newMana, messages } = r);
      newStats = r.newPlayerStats;
      newEffects = r.newPlayerEffects;
    } else {
      const r = castAbilitySingle(
        spell, p.mana, p.elementAffinity, p.elementLevels, target,
        p.stats, p.statusEffects, eff.magical_strength, eff.physical_strength,
      );
      if (!r.success) return setState(addLog(state, ...r.messages));
      if (spell.targetType !== "self") flashEnemy(targetIdx);
      newEnemies = state.combat.enemies.map((e, i) => (i === targetIdx ? r.newEnemy : e));
      ({ newMana, messages } = r);
      newStats = r.newPlayerStats;
      newEffects = r.newPlayerEffects;
    }

    // Robo de maná / vida (vector Retro, elementos vitales)
    const dealt = state.combat.enemies.reduce((s, e, i) => s + Math.max(0, e.hp - (newEnemies[i]?.hp ?? e.hp)), 0);
    if (dealt > 0 && spell.siphon) {
      const mGain = Math.round(dealt * (spell.siphon.mana ?? 0));
      const hGain = Math.round(dealt * (spell.siphon.hp ?? 0));
      if (mGain > 0) {
        newMana = { ...newMana, mana: Math.min(newMana.maxMana, newMana.mana + mGain) };
        extra.push(`↩ +${mGain} maná del daño causado.`);
      }
      if (hGain > 0) {
        newStats = { ...newStats, hp: Math.min(newStats.maxHp, newStats.hp + hGain) };
        extra.push(`❤ +${hGain} PV absorbidos.`);
      }
    }

    // Estado mental: corrupción por el tipo de magia, retroceso por inestabilidad
    if (spell.corruptionShift) {
      const c = Math.max(0, Math.min(newStats.maxCorruption, newStats.corruption + spell.corruptionShift));
      if (c !== newStats.corruption) {
        extra.push(`${spell.corruptionShift > 0 ? "☠" : "✧"} Corrupción ${spell.corruptionShift > 0 ? "+" : ""}${spell.corruptionShift}.`);
        newStats = { ...newStats, corruption: c };
      }
    }
    if (backlash > 0) {
      newStats = { ...newStats, hp: Math.max(1, newStats.hp - backlash), sanity: Math.max(0, newStats.sanity - sanityLoss) };
      extra.push(`🩸 Retroceso: −${backlash} PV, −${sanityLoss} Cordura.`);
    }

    // Experiencia elemental al rematar
    let levels = p.elementLevels;
    if (allEnemiesDead(newEnemies)) {
      (spell.elements ?? []).forEach((el, i) => {
        levels = { ...levels, [el]: Math.min(100, levels[el] + (i === 0 ? 2 : 1)) };
      });
    }

    resolve({
      ...state,
      player: { ...p, stats: newStats, mana: newMana, statusEffects: newEffects, elementLevels: levels },
      combat: { ...state.combat, enemies: newEnemies, log: [...state.combat.log, ...extra.slice(0, unstable ? 1 : 0), ...messages, ...extra.slice(unstable ? 1 : 0)] },
    });
  }

  function handleSaveRecipe(recipe: SpellRecipe) {
    setState((s) => {
      const known = s.player.recipes ?? [];
      if (known.some((r) => r.id === recipe.id)) return s;
      return addLog({ ...s, player: { ...s.player, recipes: [...known, recipe] } }, "📖 Nueva receta guardada en el grimorio.");
    });
  }

  function handleUseItem(item: Item) {
    if (!isPlayerTurn || !item.usable || !item.onUse || item.quantity < 1) return;
    const updates = item.onUse(state.player.stats, state.player.mana);
    const newItems = state.player.items
      .map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
      .filter((i) => i.quantity > 0 || !i.usable);
    resolve(
      addLog(
        {
          ...state,
          player: {
            ...state.player,
            stats: { ...state.player.stats, ...(updates as any) },
            mana: { ...state.player.mana, ...(updates as any) },
            items: newItems,
          },
        },
        `Usaste ${item.icon} ${item.name}.`,
      ),
    );
  }

  function handleFlee() {
    if (!isPlayerTurn || !canFlee) return;
    if (Math.random() > 0.5) {
      setState({ ...addLog(state, "Huiste con éxito."), combat: { ...state.combat, active: false } });
      setCombatResult(null);
      setView("hub");
    } else {
      resolve(addLog(state, "No lograste escapar."));
    }
  }

  function handleVictory(v: GameState) {
    const loot = resolveLoot(v.combat.enemies);
    const newItems = mergeLootIntoInventory(v.player.items, loot);

    const lootLines = [`--- Victoria! +${loot.xp} XP ---`];
    if (loot.gold > 0) lootLines.push(`💰 +${loot.gold} monedas de oro.`);
    for (const item of loot.items) lootLines.push(`Obtienes: ${item.icon} ${item.name} x${item.quantity}.`);
    if (loot.items.length === 0 && loot.gold === 0) lootLines.push("Los enemigos no dejaron nada.");

    const party = (v.player.party ?? []).map((c) => {
      if (!c.isRecruited) return c;
      const hp =
        c.stats.hp <= 0
          ? Math.ceil(c.stats.maxHp * 0.25)
          : Math.min(c.stats.maxHp, c.stats.hp + Math.round(c.stats.maxHp * 0.15));
      return { ...c, stats: { ...c.stats, hp } };
    });

    const { player: leveled, levelUps } = gainXp({ ...v.player, items: newItems, party }, loot.xp);
    setState({
      ...v,
      player: leveled,
      combat: { ...v.combat, active: false, log: [...v.combat.log, ...lootLines] },
    });
    setCombatResult("victory");
    if (levelUps.length) announceLevelUps(levelUps, setState);
  }

  function grantXpToElement(levels: ElementLevels, element: keyof ElementLevels, amount: number): ElementLevels {
    return { ...levels, [element]: Math.min(100, levels[element] + amount) };
  }

  function selectTarget(idx: number) {
    setState({ ...state, combat: { ...state.combat, selectedEnemyIndex: idx } });
  }

  // ── Filas de las listas ────────────────────────────────────────────────
  function abilityRows(list: (Spell | Skill)[]): Row[] {
    const p = state.player;
    return list.map((a) => {
      const cost = getEffectiveCost(a, p.elementAffinity);
      const element = "element" in a ? a.element : null;
      const reqLevel = "element" in a ? a.requiredLevel : 0;
      const locked = element !== null && p.elementLevels[element] < reqLevel;
      const ok = isPlayerTurn && canCast(a, mana, p.elementLevels, p.elementAffinity);
      return {
        key: a.id,
        icon: element ? ELEMENT_ICON[element] : "⚔",
        name: a.name,
        tag: a.areaEffect ? "AOE" : undefined,
        right: locked ? `Nv${reqLevel}` : String(cost),
        rightColor: locked ? "#E24B4A" : MANA_COLOR[a.manaType],
        disabled: !ok,
        onClick: () => handleCastAbility(a),
        info: {
          title: a.name,
          description: locked ? `Requiere nivel ${reqLevel} en ese elemento. ${a.description}` : a.description,
          cost: `${cost} ${a.manaType}`,
          costColor: MANA_COLOR[a.manaType],
          damage: a.damage,
          heal: a.heal,
          target: a.areaEffect ? "Todos los enemigos" : a.targetType === "self" ? "Tú" : (targetEnemy?.name ?? "Enemigo"),
          effects: a.effects?.map((e) => `${e.type} (${e.permanent ? "∞" : `${e.duration}t`})`),
        },
      };
    });
  }

  const itemRows: Row[] = items
    .filter((i) => i.usable)
    .map((item) => ({
      key: item.id,
      icon: item.icon,
      name: item.name,
      right: `x${item.quantity}`,
      rightColor: "#888",
      disabled: !isPlayerTurn,
      onClick: () => handleUseItem(item),
      info: { title: item.name, description: item.description ?? "Objeto consumible.", target: "Tú" },
    }));

  const rows: Row[] = tab === "skills" ? abilityRows(skills) : itemRows;

  const defaultInfo: Info | null = targetEnemy
    ? {
        title: `🎯 ${targetEnemy.name}`,
        description: SHOW_WEAKNESS
          ? `Nv ${targetEnemy.level} · ${targetEnemy.weakness ? `Débil a ${ELEMENT_ICON[targetEnemy.weakness]}` : "Sin debilidad conocida"}${targetEnemy.immunity ? ` · Inmune a ${ELEMENT_ICON[targetEnemy.immunity]}` : ""}`
          : `Nv ${targetEnemy.level}`,
        target: `Res ${targetEnemy.resistance} · R.Mág ${targetEnemy.magicResistance} · Vel ${targetEnemy.speed}`,
      }
    : null;
  const shown = info ?? defaultInfo;

  if (combat.enemies.length === 0) return null;

  const lastLines = combat.log.slice(-3);
  const playerStats = state.player.stats;
  const pm = state.player.mana;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      {/* Barra superior: ronda, iniciativa, turno */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, letterSpacing: 1.5, color: "#c9a84c" }}>⚔ RONDA {combat.round}</span>
        {bossFight && <span style={{ ...chip, color: "#ff9a3c", borderColor: "#ff9a3c66" }}>👑 JEFE</span>}
        {sanityEff.message && (
          <span title={sanityEff.message} style={{ ...chip, color: "#AFA9EC", borderColor: "#7F77DD66" }}>
            🧠 {sanityEff.message.split(" — ")[0]}
          </span>
        )}
        <div style={{ flex: 1, minWidth: 140 }}>
          <TurnOrderBar state={state} compact />
        </div>
        <span style={{
          ...chip,
          color: isPlayerTurn ? "#5DCAA5" : "#E24B4A",
          borderColor: isPlayerTurn ? "#5DCAA566" : "#E24B4A66",
        }}>
          {isPlayerTurn ? "🟢 TU TURNO" : "🔴 ENEMIGOS"}
        </span>
      </div>

      {/* Campo de batalla */}
      <div style={{ ...stage, boxShadow: bossFight ? "inset 0 0 50px #ff6b0033" : "none" }}>
        <BattleBackdrop chapterId={state.narrative.chapterId} />
        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 14, padding: "14px 14px", alignItems: "center", minHeight: 250 }}>
          {/* Enemigos (izquierda) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {combat.enemies.map((enemy, idx) => (
              <EnemyTile
                key={`${enemy.id}-${idx}`}
                enemy={enemy}
                selected={idx === targetIdx}
                shaking={shakeEnemy === idx}
                popups={popups.filter((p) => p.target === `e${idx}`)}
                onSelect={() => selectTarget(idx)}
              />
            ))}
          </div>

          {/* Grupo (derecha) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <PartyRow
              name={PLAYER_NAME}
              portrait={PLAYER_NAME}
              hp={playerStats.hp}
              maxHp={playerStats.maxHp}
              bars={[
                { label: "Maná", value: pm.mana, max: pm.maxMana, color: MANA_COLOR.mana },
                { label: "Celestial", value: pm.celestial, max: pm.maxCelestial, color: MANA_COLOR.celestial },
                { label: "Infernal", value: pm.infernal, max: pm.maxInfernal, color: "#7F77DD" },
              ]}
              active={isPlayerTurn && actor?.kind === "player"}
              hit={hitPlayer}
              popups={popups.filter((p) => p.target === "player")}
              effects={state.player.statusEffects}
            />
            {partyActive.map((c) => (
              <PartyRow
                key={c.id}
                name={c.name}
                portrait={c.name}
                hp={c.stats.hp}
                maxHp={c.stats.maxHp}
                bars={[{ label: "Maná", value: c.mana.mana, max: c.mana.maxMana, color: MANA_COLOR.mana }]}
                dead={c.stats.hp <= 0}
                popups={popups.filter((p) => p.target === c.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Ventana de mensajes */}
      <div style={messageWindow}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {lastLines.length === 0 ? (
            <div style={{ color: "#555", fontStyle: "italic", fontSize: 11 }}>El combate comienza…</div>
          ) : (
            lastLines.map((line, i) => {
              const last = i === lastLines.length - 1;
              return (
                <div key={combat.log.length - lastLines.length + i} style={{
                  fontSize: last ? 12 : 10, lineHeight: 1.5, fontFamily: "Georgia, serif",
                  opacity: last ? 1 : 0.45 + i * 0.2, ...getLineStyle(line),
                }}>
                  {line}
                </div>
              );
            })
          )}
        </div>
        <button onClick={() => setShowLog((v) => !v)} style={logBtn} title="Ver el registro completo">
          📜 {showLog ? "Cerrar" : "Registro"}
        </button>
      </div>
      {showLog && <CombatLog log={combat.log} round={combat.round} turn={combat.turn} />}

      {/* Ventana de comandos */}
      <div style={commandWindow}>
        {/* Menú */}
        <div style={{ borderRight: "1px solid #2a2a4a", paddingRight: 4, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <MenuBtn icon="🗡️" label="Atacar" disabled={!isPlayerTurn || !targetEnemy} onClick={handlePhysicalAttack}
            onHover={(on) => setInfo(on ? {
              title: state.player.equipment.mainHand?.name ?? "Ataque físico",
              description: "Golpe directo contra el objetivo con tu arma equipada. Recuperas algo de maná.",
              damage: physicalPreview(),
              target: targetEnemy?.name ?? "Sin objetivo",
            } : null)} />
          <MenuBtn icon="🛡️" label="Defender" disabled={!isPlayerTurn} onClick={handleDefend}
            onHover={(on) => setInfo(on ? {
              title: "Defender",
              description: "Recibes la mitad de daño hasta tu próximo turno y recuperas 8 de maná.",
              cost: "+8 Maná", costColor: "#5DCAA5", target: "Tú",
            } : null)} />
          <MenuBtn icon="✦" label="Habilidades" badge={String(skills.length)} active={tab === "skills"} onClick={() => setTab("skills")} onHover={() => {}} />
          <MenuBtn icon="🔮" label="Hechizos" badge="círculo" disabled={!isPlayerTurn} onClick={() => setShowCircle(true)}
            onHover={(on) => setInfo(on ? {
              title: "Círculo mágico",
              description: "Combina elementos del octagrama con runas de Sujeto, Vector y Forma para forjar tu hechizo.",
            } : null)} />
          <MenuBtn icon="🎒" label="Objetos" badge={String(itemRows.length)} active={tab === "items"} onClick={() => setTab("items")} onHover={() => {}} />
          <MenuBtn icon={canFlee ? "🏃" : "🔒"} label="Huir" danger disabled={!isPlayerTurn || !canFlee} onClick={handleFlee}
            onHover={(on) => setInfo(on ? {
              title: "Huir",
              description: canFlee ? "Intentas escapar (50% de éxito)." : "No puedes huir de este combate.",
            } : null)} />
        </div>

        {/* Lista */}
        <div style={{ overflowY: "auto", paddingRight: 2 }}>
          {rows.length === 0 ? (
            <div style={{ fontSize: 11, color: "#555", fontStyle: "italic", padding: 8 }}>
              {tab === "skills" ? "Aún no conoces habilidades. Sube de nivel para aprenderlas." : "Sin objetos usables."}
            </div>
          ) : (
            rows.map((r) => (
              <div
                key={r.key}
                onClick={r.disabled ? undefined : r.onClick}
                onMouseEnter={() => setInfo(r.info)}
                onMouseLeave={() => setInfo(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 4,
                  fontSize: 11, color: "#ddd",
                  background: info?.title === r.info.title ? "#c9a84c1a" : "transparent",
                  opacity: r.disabled ? 0.38 : 1,
                  cursor: r.disabled ? "not-allowed" : "pointer",
                }}
              >
                <span style={{ width: 16, textAlign: "center" }}>{r.icon}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                {r.tag && <span style={{ fontSize: 8, color: "#E24B4A", background: "#E24B4A22", padding: "0 4px", borderRadius: 3 }}>{r.tag}</span>}
                <span style={{ fontSize: 10, fontWeight: 700, color: r.rightColor, minWidth: 28, textAlign: "right" }}>{r.right}</span>
              </div>
            ))
          )}
        </div>

        {/* Inspector */}
        <div style={{ borderLeft: "1px solid #2a2a4a", paddingLeft: 10, fontSize: 11, overflowY: "auto" }}>
          {shown ? (
            <>
              <div style={{ fontWeight: 700, color: "#c9a84c", marginBottom: 4 }}>{shown.title}</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
                {shown.damage ? <span style={{ ...tag, color: "#ff6b6b" }}>⚔ {shown.damage}</span> : null}
                {shown.heal ? <span style={{ ...tag, color: "#5DCAA5" }}>❤ +{shown.heal}</span> : null}
                {shown.cost && <span style={{ ...tag, color: shown.costColor ?? "#378ADD" }}>{shown.cost}</span>}
              </div>
              <div style={{ color: "#bbb", lineHeight: 1.4 }}>{shown.description}</div>
              {shown.effects && shown.effects.length > 0 && (
                <div style={{ color: "#AFA9EC", marginTop: 4, fontSize: 10 }}>✨ {shown.effects.join(", ")}</div>
              )}
              {shown.target && <div style={{ color: "#777", marginTop: 4, fontSize: 10 }}>🎯 {shown.target}</div>}
            </>
          ) : (
            <div style={{ color: "#555", fontStyle: "italic" }}>Pasa el cursor sobre una acción.</div>
          )}
        </div>
      </div>

      {showCircle && (
        <SpellCircle
          ctx={forgeCtx}
          mana={state.player.mana}
          playerLevel={state.player.level}
          flags={state.flags}
          recipes={getKnownRecipes(state.player)}
          target={targetEnemy}
          isPlayerTurn={isPlayerTurn}
          onCast={(forged) => handleCastForged(forged)}
          onSaveRecipe={handleSaveRecipe}
          onClose={() => setShowCircle(false)}
        />
      )}
    </div>
  );
}

const PLAYER_NAME = "Kael'Rin";

// ─── Estilos ───────────────────────────────────────────────────────────────
const stage: React.CSSProperties = {
  position: "relative", overflow: "hidden", borderRadius: 10, border: "1px solid #2a2a4a",
};
const messageWindow: React.CSSProperties = {
  display: "flex", gap: 10, alignItems: "center", minHeight: 62,
  background: "linear-gradient(180deg, #14142a, #0d0d1a)",
  border: "1px solid #c9a84c44", borderRadius: 8, padding: "8px 12px",
};
const commandWindow: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "128px 1fr 200px", gap: 10, height: 190,
  background: "linear-gradient(180deg, #14142a, #0d0d1a)",
  border: "1px solid #c9a84c44", borderRadius: 8, padding: 8,
};
const chip: React.CSSProperties = {
  fontSize: 10, padding: "2px 8px", borderRadius: 4, border: "1px solid #333",
  fontWeight: 700, letterSpacing: 1, background: "#0d0d1a",
};
const tag: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, background: "#ffffff0d", padding: "1px 5px", borderRadius: 3,
};
const logBtn: React.CSSProperties = {
  background: "transparent", color: "#888", border: "1px solid #333", borderRadius: 5,
  padding: "4px 8px", fontSize: 10, cursor: "pointer", fontFamily: "Georgia, serif", flexShrink: 0,
};
const arrow: React.CSSProperties = {
  position: "absolute", left: -11, top: "50%", transform: "translateY(-50%)",
  color: "#c9a84c", fontSize: 12, animation: "nudge 0.9s ease-in-out infinite",
};
const floater: React.CSSProperties = {
  position: "absolute", right: 12, top: -6, fontSize: 18, fontWeight: 800, zIndex: 5,
  pointerEvents: "none", textShadow: "0 0 6px #000, 0 2px 4px #000", animation: "floatUp 1s ease-out forwards",
};