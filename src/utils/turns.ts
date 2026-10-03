import type { Companion } from "../types/companion.type";
import type { ActorRef } from "../types/combat-state.type";
import type { Enemy } from "../types/enemy.type";
import type { GameState } from "../types/game-state";
import { getEnemy } from "../data/enemies";
import { allEnemiesDead, applyEnemyStatusEffects, applyPlayerStatusEffects, enemyAttack } from "./combat";
import { getEffectiveStats, getEnemyEffectiveStats } from "./equipment";

export type Outcome = "continue" | "victory" | "defeat";

/** Ajustes rápidos de balance */
const COMPANION_MANA_REGEN = 4;   // maná que recupera cada compañero por ronda
const COMPANION_SKILL_SCALE = 0.7; // peso del daño base de la habilidad
const COMPANION_STR_SCALE = 0.35;  // peso de la fuerza del compañero
const COMPANION_BASIC_SCALE = 0.5; // ataque básico sin maná
const MAX_ACTIVE_COMPANIONS = 2;
const MAX_ENEMIES = 4;

const log = (s: GameState, ...lines: string[]): GameState => ({
    ...s,
    combat: { ...s.combat, log: [...s.combat.log, ...lines] },
});

const activeCompanions = (s: GameState): Companion[] =>
    (s.player.party ?? []).filter((c) => c.isRecruited && c.isActive).slice(0, MAX_ACTIVE_COMPANIONS);

/** Enemigo objetivo: el elegido por el jugador, o el primer vivo */
export function getTargetIdx(combat: GameState["combat"]): number {
    const cur = combat.enemies[combat.selectedEnemyIndex];
    if (cur && cur.hp > 0) return combat.selectedEnemyIndex;
    return combat.enemies.findIndex((e) => e.hp > 0);
}

/** Iniciativa: mayor velocidad actúa primero; en empate, jugador > compañeros > enemigos */
export function buildOrder(s: GameState): ActorRef[] {
    const entries: { ref: ActorRef; speed: number; prio: number }[] = [];
    const eff = getEffectiveStats(s.player.stats, s.player.equipment, s.player.statusEffects);
    entries.push({ ref: { kind: "player" }, speed: eff.speed, prio: 0 });
    for (const c of activeCompanions(s)) {
        if (c.stats.hp > 0) entries.push({ ref: { kind: "companion", id: c.id }, speed: c.stats.speed, prio: 1 });
    }
    s.combat.enemies.forEach((e, idx) => {
        if (e.hp > 0) entries.push({ ref: { kind: "enemy", idx }, speed: getEnemyEffectiveStats(e).speed, prio: 2 });
    });
    entries.sort((a, b) => b.speed - a.speed || a.prio - b.prio);
    return entries.map((e) => e.ref);
}

// ─── Fases de jefe ─────────────────────────────────────────────────────────
function applyPhases(enemies: Enemy[]): { enemies: Enemy[]; messages: string[] } {
    const out = [...enemies];
    const spawned: Enemy[] = [];
    const messages: string[] = [];

    for (let i = 0; i < out.length; i++) {
        let e = out[i];
        if (e.hp <= 0 || !e.phases) continue;
        let phase = e.phase ?? 0;
        const phases = e.phases;
        while (phases && phase < phases.length && e.hp / e.maxHp <= phases[phase].hpBelowPct / 100) {
            const p = phases[phase];
            phase++;
            const heal = p.healPct ? Math.round((e.maxHp * p.healPct) / 100) : 0;
            e = {
                ...e,
                phase,
                hp: Math.min(e.maxHp, e.hp + heal),
                physical_strength: e.physical_strength + (p.buffs?.physical_strength ?? 0),
                magical_strength: e.magical_strength + (p.buffs?.magical_strength ?? 0),
                speed: e.speed + (p.buffs?.speed ?? 0),
                resistance: Math.max(0, e.resistance + (p.buffs?.resistance ?? 0)),
                magicResistance: Math.max(0, e.magicResistance + (p.buffs?.magicResistance ?? 0)),
                skills: [...e.skills, ...(p.addSkills ?? []).filter((id) => !e.skills.includes(id))],
                spells: [...e.spells, ...(p.addSpells ?? []).filter((id) => !e.spells.includes(id))],
                statusEffects: [...e.statusEffects, ...(p.addEffects ?? []).map((x) => ({ ...x }))],
            };
            messages.push(`⚠️ FASE ${phase + 1} — ${e.name}: ${p.message}`);
            for (const id of p.summon ?? []) {
                if (out.length + spawned.length >= MAX_ENEMIES) break;
                const minion = getEnemy(id);
                spawned.push(minion);
                messages.push(`${minion.name} acude al combate.`);
            }
        }
        out[i] = e;
    }
    return { enemies: [...out, ...spawned], messages };
}

function withPhases(s: GameState): GameState {
    const { enemies, messages } = applyPhases(s.combat.enemies);
    if (messages.length === 0) return s;
    return log({ ...s, combat: { ...s.combat, enemies } }, ...messages);
}

// ─── Acción de un enemigo ──────────────────────────────────────────────────
type Target = { kind: "player" } | { kind: "companion"; c: Companion };

function enemyAct(s: GameState, idx: number): GameState {
    const enemy = s.combat.enemies[idx];
    if (!enemy || enemy.hp <= 0) return s;
    const eff = getEnemyEffectiveStats(enemy);

    // El jugador pesa el doble que cada compañero vivo
    const pool: Target[] = [
        { kind: "player" },
        { kind: "player" },
        ...activeCompanions(s).filter((c) => c.stats.hp > 0).map((c): Target => ({ kind: "companion", c })),
    ];
    const pick = pool[Math.floor(Math.random() * pool.length)];

    const withEnemy = (res: ReturnType<typeof enemyAttack>) =>
        s.combat.enemies.map((e, i) =>
            i === idx ? { ...enemy, hp: res.newEnemy.hp, statusEffects: res.newEnemy.statusEffects } : e,
        );

    if (pick.kind === "player") {
        const defense = getEffectiveStats(s.player.stats, s.player.equipment, s.player.statusEffects);
        const res = enemyAttack(eff, defense);
        let dmg = Math.max(0, defense.hp - res.newStats.hp);
        const messages = [...res.messages];
        if (dmg > 0 && s.player.statusEffects.some((e) => e.type === "guarding")) {
            const reduced = Math.ceil(dmg / 2);
            messages.push(`🛡️ Tu guardia absorbe ${dmg - reduced} de daño.`);
            dmg = reduced;
        }
        const ns: GameState = {
            ...s,
            player: { ...s.player, stats: { ...s.player.stats, hp: Math.max(0, s.player.stats.hp - dmg) } },
            combat: { ...s.combat, enemies: withEnemy(res) },
        };
        return log(ns, ...messages);
    }

    const c = pick.c;
    const res = enemyAttack(eff, c.stats);
    const messages = [`${enemy.name} apunta a ${c.name}.`, ...res.messages];
    if (res.newStats.hp <= 0) messages.push(`💀 ${c.name} cae en combate.`);
    const party = (s.player.party ?? []).map((x) =>
        x.id === c.id ? { ...x, stats: { ...x.stats, hp: res.newStats.hp } } : x,
    );
    return log(
        { ...s, player: { ...s.player, party }, combat: { ...s.combat, enemies: withEnemy(res) } },
        ...messages,
    );
}

// ─── Acción de un compañero (IA) ───────────────────────────────────────────
function companionAct(s: GameState, id: string): GameState {
    const party = s.player.party ?? [];
    const c = party.find((x) => x.id === id);
    if (!c || c.stats.hp <= 0) return s;

    const spend = (cost: number) =>
        party.map((x) => (x.id === id ? { ...x, mana: { ...x.mana, mana: x.mana.mana - cost } } : x));

    // 1) Curar al aliado más débil si está por debajo del 50%
    const allies = [
        { id: "player", name: "Kael'Rin", pct: s.player.stats.hp / s.player.stats.maxHp },
        ...activeCompanions(s)
            .filter((x) => x.stats.hp > 0)
            .map((x) => ({ id: x.id, name: x.name, pct: x.stats.hp / x.stats.maxHp })),
    ].sort((a, b) => a.pct - b.pct);
    const weakest = allies[0];
    const healSkill = c.skills.find((sk) => (sk.damage ?? 0) < 0 && c.mana.mana >= sk.manaCost);

    if (healSkill && weakest.pct < 0.5) {
        const amount = Math.abs(healSkill.damage!) + Math.floor(c.stats.magical_strength * 0.3);
        let player = s.player;
        let newParty = spend(healSkill.manaCost);
        if (weakest.id === "player") {
            player = { ...player, stats: { ...player.stats, hp: Math.min(player.stats.maxHp, player.stats.hp + amount) } };
        } else {
            newParty = newParty.map((x) =>
                x.id === weakest.id
                    ? { ...x, stats: { ...x.stats, hp: Math.min(x.stats.maxHp, x.stats.hp + amount) } }
                    : x,
            );
        }
        return log({ ...s, player: { ...player, party: newParty } }, `✨ ${c.name} usa ${healSkill.name}: ${weakest.name} recupera ${amount} PV.`);
    }

    // 2) Atacar al objetivo del jugador
    const tIdx = getTargetIdx(s.combat);
    if (tIdx < 0) return s;
    const enemy = s.combat.enemies[tIdx];
    const magical = c.role === "mage" || c.role === "priest";
    const str = magical ? c.stats.magical_strength : c.stats.physical_strength;
    const def = magical ? enemy.magicResistance / 3 : enemy.resistance / 2;

    const skill = c.skills
        .filter((sk) => (sk.damage ?? 0) > 0 && c.mana.mana >= sk.manaCost)
        .sort((a, b) => (b.damage ?? 0) - (a.damage ?? 0))[0];

    const raw = skill ? (skill.damage ?? 0) * COMPANION_SKILL_SCALE + str * COMPANION_STR_SCALE : str * COMPANION_BASIC_SCALE;
    const crit = c.role === "rogue" && Math.random() < 0.25;
    const dmg = Math.max(1, Math.round((raw - def) * (crit ? 1.5 : 1)));

    const enemies = s.combat.enemies.map((e, i) => (i === tIdx ? { ...e, hp: Math.max(0, e.hp - dmg) } : e));
    const msg = `⚔️ ${c.name} ${skill ? `usa ${skill.name}` : "ataca"} → ${dmg} daño a ${enemy.name}.${crit ? " ¡CRÍTICO!" : ""}`;
    return log(
        { ...s, player: { ...s.player, party: skill ? spend(skill.manaCost) : party }, combat: { ...s.combat, enemies } },
        msg,
    );
}

// ─── Fin de ronda ──────────────────────────────────────────────────────────
function endRound(s: GameState): GameState {
    const lines: string[] = [];
    const enemies = s.combat.enemies.map((e) => {
        if (e.hp <= 0) return e;
        const r = applyEnemyStatusEffects(e);
        lines.push(...r.messages);
        return r.newEnemy;
    });
    const pr = applyPlayerStatusEffects(s.player.statusEffects, s.player.stats);
    lines.push(...pr.messages);

    const party = (s.player.party ?? []).map((c) =>
        c.isRecruited && c.isActive && c.stats.hp > 0
            ? { ...c, mana: { ...c.mana, mana: Math.min(c.mana.maxMana, c.mana.mana + COMPANION_MANA_REGEN) } }
            : c,
    );

    let ns: GameState = {
        ...s,
        player: { ...s.player, stats: pr.newStats, statusEffects: pr.newEffects, party },
        combat: { ...s.combat, enemies },
    };
    ns = log(ns, ...lines);
    ns = withPhases(ns);

    const round = s.combat.round + 1;
    ns = log({ ...ns, combat: { ...ns.combat, round, turnIdx: 0 } }, `--- Ronda ${round} ---`);
    return { ...ns, combat: { ...ns.combat, order: buildOrder(ns) } };
}

// ─── Bucle principal ───────────────────────────────────────────────────────
/** Procesa actores automáticos hasta que le toque al jugador o termine el combate */
function runActors(input: GameState): { state: GameState; outcome: Outcome } {
    let s = input;
    for (let guard = 0; guard < 200; guard++) {
        if (allEnemiesDead(s.combat.enemies)) return { state: s, outcome: "victory" };
        if (s.player.stats.hp <= 0) return { state: log(s, "Has caído en combate..."), outcome: "defeat" };

        const { order, turnIdx } = s.combat;
        if (turnIdx >= order.length) {
            s = endRound(s);
            continue;
        }

        const actor = order[turnIdx];
        if (actor.kind === "player") {
            // La guardia dura hasta que vuelve a tocarte
            return {
                state: {
                    ...s,
                    player: { ...s.player, statusEffects: s.player.statusEffects.filter((e) => e.type !== "guarding") },
                    combat: { ...s.combat, turn: "player" },
                },
                outcome: "continue",
            };
        }

        s = actor.kind === "enemy" ? enemyAct(s, actor.idx) : companionAct(s, actor.id);
        s = withPhases(s);
        s = { ...s, combat: { ...s.combat, turnIdx: s.combat.turnIdx + 1 } };
    }
    return { state: s, outcome: "continue" };
}

/** Inicia el combate: calcula el orden y deja actuar a los más rápidos que el jugador */
export function beginCombat(s: GameState) {
    const ns: GameState = { ...s, combat: { ...s.combat, round: 1, turnIdx: 0, order: buildOrder(s) } };
    return runActors(ns);
}

/** Se llama cuando el jugador termina su acción (con sus efectos ya aplicados al estado) */
export function endPlayerTurn(s: GameState): { state: GameState; outcome: Outcome } {
    const ns = withPhases(s);
    if (allEnemiesDead(ns.combat.enemies)) return { state: ns, outcome: "victory" };
    return runActors({ ...ns, combat: { ...ns.combat, turnIdx: ns.combat.turnIdx + 1 } });
}