import { useState, useEffect, useRef } from "react";
import {
  applyQuestReward,
  levelFromXp,
  type LevelUpInfo,
} from "./utils/leveling";
import { announceLevelUps } from "./utils/level-up-ui";
import Swal from "sweetalert2";
import { CHAPTERS } from "./data/events";
import { getSpellById } from "./data/spells";
import { buildInventory } from "./data/items";
import { getEquipment } from "./data/equipment";
import { PLAYER_PROFILE } from "./data/player";
import { StatsPanel } from "./components/StatsPanel";
import { CombatView } from "./views/CombatView";
import { emptyGear, equipItem } from "./utils/equipment";
import StoryView from "./views/StoryView";
import InventoryView from "./views/InventoryView";
import EquipmentView from "./views/EquipmentView";
import ShopView from "./views/ShopView";
import ExploreView from "./views/ExploreView";
import HubView from "./views/HubView";
import { getEndingDetails } from "./utils/get-ending";
import GrimoireView from "./views/GrimoireView";
import PartyView from "./views/PartyView";
import QuestView from "./views/QuestView";
import { ALL_QUESTS } from "./data/quests";
import { INITIAL_COMPANIONS } from "./data/companions";
import { getEnemy } from "./data/enemies";
import { initCombat } from "./utils/combat";
import type { GameState } from "./types/game-state";
import type { EquippedGear } from "./types/equipment.type";
import { getSkillById } from "./data/skills";
import type { View } from "./types/view.type";

const STORAGE_KEY = "magicx_v5";

function buildStartingEquipment(): EquippedGear {
  let gear = emptyGear();
  const startingIds = PLAYER_PROFILE.startingEquipmentIds ?? [];
  for (const { id, slot } of startingIds) {
    const item = getEquipment(id);
    if (item) {
      const result = equipItem(gear, item, slot);
      gear = result.newGear;
    }
  }
  return gear;
}

function buildInitialState(): GameState {
  const p = PLAYER_PROFILE;
  return {
    player: {
      stats: { ...p.baseStats },
      mana: { ...p.baseMana },
      type: p.type,
      elementLevels: { ...p.elementLevels },
      elementAffinity: { ...p.elementAffinity },
      spells: p.startingSpellIds.map((id) => getSpellById(id)!).filter(Boolean),
      items: buildInventory(p.startingItemIds),
      equipment: buildStartingEquipment(),
      statusEffects: [],
      skills: p.startingSkillIds.map((id) => getSkillById(id)!).filter(Boolean),
      xp: 0,
      level: 1,
      party: INITIAL_COMPANIONS,
    },
    combat: {
      active: false,
      enemies: [],
      selectedEnemyIndex: 0,
      turn: "player",
      round: 1,
      log: [],
      comboSlot: [],
      order: [],
      turnIdx: 0,
    },
    narrative: {
      chapterId: CHAPTERS[0].id,
      nodeId: CHAPTERS[0].startNodeId,
      narrativeLog: [],
    },
    quests: ALL_QUESTS,
    flags: {},
    scene: null,
    returnTo: "hub",
  };
}

export default function App() {
  // States
  const [state, setState] = useState<GameState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return buildInitialState();
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        quests: parsed.quests ?? ALL_QUESTS,
        player: {
          ...parsed.player,
          party: parsed.player?.party ?? INITIAL_COMPANIONS,
          level: parsed.player?.level ?? levelFromXp(parsed.player?.xp ?? 0),
        },
        flags: parsed.flags ?? {},
        scene: parsed.scene ?? null,
      };
    } catch {
      return buildInitialState();
    }
  });

  const [view, setView] = useState<View>("hub");
  const [gameOver, setGameOver] = useState(false);
  const [combatResult, setCombatResult] = useState<"victory" | "defeat" | null>(
    null,
  );

  const [shopMessage, setShopMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const claimedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const chapterId = state.narrative.chapterId;
    let changed = false;
    let player = state.player;
    const lines: string[] = [];
    const levelUps: LevelUpInfo[] = [];

    const quests = state.quests.map((q) => {
      if (q.status === "locked" && q.chapterId === chapterId) {
        changed = true;
        return { ...q, status: "active" as const };
      }
      if (
        q.status === "completed" &&
        q.reward &&
        !q.rewardClaimed &&
        !claimedRef.current.has(q.id)
      ) {
        claimedRef.current.add(q.id);
        const res = applyQuestReward(player, q);
        player = res.player;
        levelUps.push(...res.levelUps);
        lines.push(`<b>${q.icon} ${q.title}</b><br/>${res.lines.join(" · ")}`);
        changed = true;
        return { ...q, rewardClaimed: true };
      }
      return q;
    });

    if (!changed) return;
    setState((s) => ({
      ...s,
      player: { ...s.player, ...player, elementLevels: s.player.elementLevels },
      quests,
    }));

    if (lines.length) {
      Swal.fire({
        title: "📋 Misión completada",
        html: `<div style="text-align:left;font-size:13px;line-height:1.7">${lines.join("<br/><br/>")}</div>`,
        background: "#1a1a2e",
        color: "#eee",
        confirmButtonColor: "#c9a84c",
      }).then(() => announceLevelUps(levelUps, setState));
    } else if (levelUps.length) {
      announceLevelUps(levelUps, setState);
    }
  }, [state.quests, state.narrative.chapterId]);

  function handleBackToHub() {
    setView("hub");
    setShopMessage(null);
    setCombatResult(null);
  }

  function handleContinueAfterCombat() {
    setCombatResult(null);
    setView("hub");
    setState({ ...state, combat: { ...state.combat, active: false } });
  }

  function handleRestart() {
    localStorage.removeItem(STORAGE_KEY);
    setState(buildInitialState());
    setGameOver(false);
    setCombatResult(null);
    setView("hub");
    setShopMessage(null);
  }

  return (
    <div style={page}>
      {/* Header */}
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          position: "relative",
          marginBottom: 20,
        }}
      >
        <h1 style={{ ...titleStyle, marginBottom: 0 }}>Magic X</h1>
        <button
          onClick={handleRestart}
          style={{
            ...smallBtn,
            position: "absolute",
            right: 0,
            top: 4,
            color: "#888",
            borderColor: "#333",
          }}
          title="Reiniciar aventura"
        >
          Reiniciar
        </button>
      </div>

      <div style={layout}>
        {/* Left */}
        <div style={{ width: 210, flexShrink: 0 }}>
          <StatsPanel
            stats={state.player.stats}
            mana={state.player.mana}
            role={state.player.type}
            statusEffects={state.player.statusEffects}
            elementLevels={state.player.elementLevels}
            elementAffinity={state.player.elementAffinity}
            characterName={PLAYER_PROFILE.name}
            xp={state.player.xp}
            level={state.player.level}
            gold={
              state.player.items.find((i) => i.id === "gold")?.quantity || 0
            }
          />
        </div>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {combatResult === "victory" && (
            <div style={resultBox("#1D9E7522", "#1D9E75")}>
              <span>Victoria. El enemigo ha caído.</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={smallBtn}
                  onClick={() => {
                    const dest = state.returnTo ?? "hub";
                    setCombatResult(null);
                    setView(dest);
                    setState((s) => ({
                      ...s,
                      combat: { ...s.combat, active: false },
                    }));
                  }}
                >
                  {
                    (
                      {
                        story: "Continuar Historia",
                        scene: "Continuar escena",
                        explore: "Volver al Mapa",
                        hub: "Volver al Hub",
                      } as Record<string, string>
                    )[state.returnTo ?? "hub"] ?? "Continuar"
                  }
                </button>
                <button style={smallBtn} onClick={handleContinueAfterCombat}>
                  Volver al Hub
                </button>
              </div>
            </div>
          )}

          {gameOver ? (
            (() => {
              const ending = getEndingDetails(
                state.player.stats,
                state.player.xp,
                state.player.mana,
                state.player.party ?? [],
              );
              return (
                <div style={endCard}>
                  <div
                    style={{
                      fontSize: 40,
                      textAlign: "center",
                      marginBottom: 8,
                    }}
                  >
                    {state.player.stats.hp <= 0 ? "💀" : ending.icon}
                  </div>
                  <h2
                    style={{
                      color: ending.color,
                      marginBottom: 4,
                      textAlign: "center",
                    }}
                  >
                    {state.player.stats.hp <= 0
                      ? "Caíste en Combate"
                      : ending.title}
                  </h2>
                  <h4
                    style={{
                      color: "#aaa",
                      textAlign: "center",
                      fontWeight: "normal",
                      marginTop: 0,
                      marginBottom: 16,
                    }}
                  >
                    {state.player.stats.hp <= 0
                      ? "Tu viaje ha concluido por ahora..."
                      : ending.subtitle}
                  </h4>
                  <p
                    style={{
                      color: "#ccc",
                      fontSize: 13,
                      lineHeight: 1.6,
                      background: "rgba(0,0,0,0.3)",
                      padding: 12,
                      borderRadius: 6,
                    }}
                  >
                    {state.player.stats.hp <= 0
                      ? "Tu fuerza y maná se agotaron en el fragor de la batalla. Las sombras del santuario te envuelven."
                      : ending.description}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#888",
                      fontSize: 11,
                      marginTop: 12,
                    }}
                  >
                    <span>XP acumulada: {state.player.xp}</span>
                    <span>
                      Compañeros reclutados:{" "}
                      {
                        (state.player.party ?? []).filter((c) => c.isRecruited)
                          .length
                      }
                    </span>
                  </div>
                  <button
                    style={{
                      ...restartBtn,
                      borderColor: ending.color,
                      color: ending.color,
                      width: "100%",
                      marginTop: 16,
                    }}
                    onClick={handleRestart}
                  >
                    🔄 Renacer / Nueva Aventura
                  </button>
                </div>
              );
            })()
          ) : (
            <>
              {/* HUB */}
              {view === "hub" && (
                <HubView
                  setState={setState}
                  setView={setView}
                  setShopMessage={setShopMessage}
                  chapterTitle={
                    CHAPTERS.find((c) => c.id === state.narrative.chapterId)
                      ?.title ?? ""
                  }
                  chapterId={state.narrative.chapterId}
                  onResumeScene={
                    state.scene ? () => setView("scene") : undefined
                  }
                />
              )}

              {/* EXPLORE / MAP */}
              {view === "explore" && (
                <ExploreView
                  state={state}
                  setState={setState}
                  onBackToHub={handleBackToHub}
                  onStartCombat={(enemyId) => {
                    const enemy = getEnemy(enemyId);
                    setState((s) => ({
                      ...s,
                      combat: initCombat([enemy]),
                      returnTo: "explore",
                    }));
                    setView("combat");
                  }}
                  onStartScene={() => setView("scene")}
                  onGoToShop={() => setView("shop")}
                />
              )}

              {/* PARTY */}
              {view === "party" && (
                <PartyView
                  state={state}
                  setState={setState}
                  onBackToHub={handleBackToHub}
                />
              )}

              {/* COMBAT */}
              {view === "combat" && (
                <CombatView
                  skills={state.player.skills}
                  combat={state.combat}
                  spells={state.player.spells}
                  items={state.player.items}
                  stats={state.player.stats}
                  mana={state.player.mana}
                  setState={setState}
                  state={state}
                  setCombatResult={setCombatResult}
                  setView={setView}
                  setGameOver={setGameOver}
                />
              )}

              {/* SHOP */}
              {view === "shop" && (
                <ShopView
                  state={state}
                  setState={setState}
                  setShopMessage={setShopMessage}
                  shopMessage={shopMessage}
                  handleBackToHub={handleBackToHub}
                />
              )}

              {/* INVENTORY */}
              {view === "inventory" && (
                <InventoryView
                  state={state}
                  setState={setState}
                  handleBackToHub={handleBackToHub}
                />
              )}

              {/* EQUIPMENT */}
              {view === "equipment" && (
                <EquipmentView
                  state={state}
                  setState={setState}
                  handleBackToHub={handleBackToHub}
                />
              )}

              {/* STORY */}
              {view === "story" &&
                !state.combat.active &&
                CHAPTERS.some((c) => c.id === state.narrative.chapterId) && (
                  <StoryView
                    mode="chapter"
                    state={state}
                    setState={setState}
                    setView={setView}
                    setGameOver={setGameOver}
                    handleBackToHub={handleBackToHub}
                  />
                )}
              {view === "scene" && (
                <StoryView
                  mode="scene"
                  state={state}
                  setState={setState}
                  setView={setView}
                  setGameOver={setGameOver}
                  handleBackToHub={handleBackToHub}
                />
              )}

              {/* GRIMOIRE */}
              {view === "grimoire" && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>📖</span>
                    <h2
                      style={{
                        color: "#c9a84c",
                        margin: 0,
                        fontSize: 16,
                      }}
                    >
                      Grimorio
                    </h2>
                    <button
                      onClick={handleBackToHub}
                      style={{
                        ...smallBtn,
                        marginLeft: 12,
                      }}
                    >
                      Volver al Hub
                    </button>
                  </div>
                  <GrimoireView
                    playerSpells={state.player.spells}
                    elementLevels={state.player.elementLevels}
                  />
                </div>
              )}

              {/* QUESTS */}
              {view === "quests" && (
                <QuestView state={state} onBack={handleBackToHub} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Styles
export const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0d0d1a",
  color: "#eee",
  fontFamily: "Georgia, serif",
  padding: "28px 16px",
};
export const titleStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#c9a84c",
  letterSpacing: 4,
  marginBottom: 20,
  fontSize: "1.5rem",
};
export const layout: React.CSSProperties = {
  display: "flex",
  gap: 14,
  maxWidth: 960,
  margin: "0 auto",
  alignItems: "flex-start",
};
export const endCard: React.CSSProperties = {
  background: "#1a1a2e",
  border: "1px solid #444",
  borderRadius: 8,
  padding: 24,
};
export const restartBtn: React.CSSProperties = {
  marginTop: 14,
  background: "#c9a84c22",
  color: "#c9a84c",
  border: "1px solid #c9a84c",
  borderRadius: 6,
  padding: "7px 18px",
  cursor: "pointer",
  fontSize: 11,
};
export const smallBtn: React.CSSProperties = {
  marginLeft: 12,
  background: "transparent",
  color: "inherit",
  border: "1px solid currentColor",
  borderRadius: 5,
  padding: "3px 10px",
  cursor: "pointer",
  fontSize: 11,
};
export const gCard: React.CSSProperties = {
  background: "#1a1a2e",
  border: "1px solid #222",
  borderRadius: 8,
  padding: 12,
};
export const gTitle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 2,
  color: "#555",
  marginBottom: 10,
};
export const spellRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "5px 4px",
  borderBottom: "1px solid #12122a",
};
export const filterBtn: React.CSSProperties = {
  background: "#12122a",
  border: "1px solid #2a2a4a",
  borderRadius: 5,
  padding: "4px 10px",
  color: "#666",
  cursor: "pointer",
  fontSize: 10,
  fontFamily: "Georgia, serif",
};
export const filterActive: React.CSSProperties = {
  color: "#c9a84c",
  borderColor: "#c9a84c44",
};
export const resultBox = (bg: string, border: string): React.CSSProperties => ({
  background: bg,
  border: `1px solid ${border}`,
  borderRadius: 8,
  padding: "10px 14px",
  color: border,
  fontSize: 12,
  marginBottom: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});
