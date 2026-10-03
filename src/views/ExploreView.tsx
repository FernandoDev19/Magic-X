import { useState } from "react";
import type { GameState } from "../types/game-state";
import type { MapNode } from "../types/map.type";
import { generateMapForChapter } from "../utils/map-generator";
import { getCompanionById } from "../data/companions";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { SCENES } from "../data/scenes";
import { completeObjectives } from "../utils/quests";

const MySwal = withReactContent(Swal);

interface Props {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  onBackToHub: () => void;
  onStartCombat: (enemyId: string) => void;
  onGoToShop: () => void;
  onStartScene: () => void;
}

const NODE_ICONS: Record<string, string> = {
  combat: "⚔️",
  elite: "💀",
  boss: "👑",
  event: "📜",
  companion: "🤝",
  rest: "⛺",
  shop: "💎",
  altar: "🔮",
  story: "⭐",
};

const NODE_TYPE_LABEL: Record<string, string> = {
  combat: "Combate",
  elite: "Élite",
  boss: "Jefe",
  event: "Evento",
  companion: "Aliado",
  rest: "Descanso",
  shop: "Tienda",
  altar: "Altar",
  story: "Historia",
};

const NODE_BORDER_COLOR: Record<string, string> = {
  combat: "#E24B4A",
  elite: "#9b5cf6",
  boss: "#ff6b00",
  event: "#7F77DD",
  companion: "#E89F5B",
  rest: "#5DCAA5",
  shop: "#c9a84c",
  altar: "#af85ea",
  story: "#4ae286",
};

const CHAPTER_THEMES: Record<
  string,
  { name: string; bg: string; accent: string; gradient: string }
> = {
  ch1: {
    name: "Las Mazmorras del Bastión",
    bg: "#07070f",
    accent: "#c9a84c",
    gradient: "radial-gradient(ellipse at 30% 50%, #12101e 0%, #07070f 70%)",
  },
  ch2: {
    name: "El Reino Caído de Oakhaven",
    bg: "#0d0507",
    accent: "#9b3c3c",
    gradient: "radial-gradient(ellipse at 50% 30%, #1e0b0b 0%, #0d0507 70%)",
  },
  ch3: {
    name: "La Aguja de la Eternidad",
    bg: "#05070f",
    accent: "#4a7fc9",
    gradient: "radial-gradient(ellipse at 50% 80%, #0b0d1e 0%, #05070f 70%)",
  },
};

// function markQuestObjectiveComplete(quests: typeof ALL_QUESTS, questId: string, objectiveId: string) {
//     return quests.map(q => {
//         if (q.id !== questId) return q;
//         const updatedObjs = q.objectives.map(o =>
//             o.id === objectiveId ? { ...o, completed: true } : o
//         );
//         const allDone = updatedObjs.every(o => o.completed);
//         return { ...q, objectives: updatedObjs, status: allDone ? "completed" as const : q.status };
//     });
// }

export default function ExploreView({
  state,
  setState,
  onBackToHub,
  onStartCombat,
  onGoToShop,
  onStartScene,
}: Props) {
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const currentChapterId = state.narrative.chapterId ?? "ch1";
  let mapState = state.mapState;

  if (!mapState || mapState.chapterId !== currentChapterId) {
    mapState = generateMapForChapter(currentChapterId);
  }

  const theme = CHAPTER_THEMES[currentChapterId] ?? CHAPTER_THEMES["ch1"];

  // Group nodes by row
  const maxRow = Math.max(...(mapState?.nodes.map((n) => n.row) ?? [0]));
  const rows: MapNode[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    rows.push(mapState?.nodes.filter((n) => n.row === r) ?? []);
  }

  function handleSelectNode(node: MapNode) {
    if (!node.accessible && !node.current && !node.completed) {
      MySwal.fire({
        title: "🔒 Camino Bloqueado",
        text: "Debes completar las ubicaciones anteriores antes de avanzar por aquí.",
        icon: "info",
        background: "#1a1a2e",
        color: "#eee",
        confirmButtonColor: "#c9a84c",
      });
      return;
    }
    setSelectedNode(node);
  }

  // function advanceQuestsForNode(node: MapNode, currentQuests: Quest[]): Quest[] {
  //     let qs = [...currentQuests];
  //     if (!node.questId) return qs;
  //     const quest = qs.find((q) => q.id === node.questId);
  //     if (!quest || quest.status === "locked" || quest.status === "completed") return qs;
  //     const firstIncomplete = quest.objectives.find((o: QuestObjective) => !o.completed);
  //     if (firstIncomplete) {
  //         qs = markQuestObjectiveComplete(qs, node.questId, firstIncomplete.id);
  //     }
  //     return qs;
  // }

  function handleExecuteNode(node: MapNode) {
    if (!mapState) return;

    const nextNodes = mapState.nodes.map((n) => {
      if (n.id === node.id)
        return { ...n, completed: true, current: false, accessible: false };
      if (node.connectedTo.includes(n.id)) return { ...n, accessible: true };
      return n;
    });

    const base: GameState = {
      ...state,
      mapState: { ...mapState, nodes: nextNodes, currentNodeId: node.id },
      quests: completeObjectives(state.quests, node.completes ?? []),
    };

    const startScene = (s: GameState, sceneId: string) => {
      setState({
        ...s,
        scene: { sceneId, nodeId: SCENES[sceneId].startNodeId },
      });
      setSelectedNode(null);
      onStartScene();
    };

    // Descanso: cura y, si hay escena, conversación junto al fuego
    if (node.type === "rest") {
      const healHp = Math.floor(state.player.stats.maxHp * 0.4);
      const healMp = Math.floor(state.player.mana.maxMana * 0.4);
      const rested: GameState = {
        ...base,
        player: {
          ...state.player,
          stats: {
            ...state.player.stats,
            hp: Math.min(
              state.player.stats.maxHp,
              state.player.stats.hp + healHp,
            ),
            sanity: Math.min(100, state.player.stats.sanity + 20),
          },
          mana: {
            ...state.player.mana,
            mana: Math.min(
              state.player.mana.maxMana,
              state.player.mana.mana + healMp,
            ),
            celestial: Math.min(
              state.player.mana.maxCelestial,
              state.player.mana.celestial + 15,
            ),
            infernal: Math.min(
              state.player.mana.maxInfernal,
              state.player.mana.infernal + 15,
            ),
          },

          party: (state.player.party ?? []).map((c) =>
            c.isRecruited
              ? {
                  ...c,
                  stats: {
                    ...c.stats,
                    hp: Math.min(
                      c.stats.maxHp,
                      c.stats.hp + Math.floor(c.stats.maxHp * 0.5),
                    ),
                  },
                  mana: { ...c.mana, mana: c.mana.maxMana },
                }
              : c,
          ),
        },
      };
      const popup = MySwal.fire({
        title: "⛺ Descanso en el Campamento",
        html: `<div style="text-align:left;font-size:13px;line-height:1.6">
                <div>❤️ +${healHp} Puntos de Vida</div>
                <div>💧 +${healMp} Maná</div>
                <div>✨ +15 Maná Celestial</div>
                <div>🔥 +15 Maná Infernal</div>
                <div>🧠 +20 Cordura</div></div>`,
        background: "#1a1a2e",
        color: "#eee",
        confirmButtonColor: "#5DCAA5",
      });
      if (node.sceneId) popup.then(() => startScene(rested, node.sceneId!));
      else setState(rested);
      setSelectedNode(null);
      return;
    }

    // Cualquier nodo con escena (eventos, aliados, jefes, historia)
    if (node.sceneId) return startScene(base, node.sceneId);

    if (
      node.type === "combat" ||
      node.type === "elite" ||
      node.type === "boss"
    ) {
      setState(base);
      onStartCombat(node.enemyId ?? "bandit");
      return;
    }

    if (node.type === "shop") {
      setState(base);
      onGoToShop();
      return;
    }

    if (node.type === "companion") {
      const companion = getCompanionById(node.companionId ?? "lyra");
      if (companion) {
        const party = state.player.party ?? [];
        const newParty = party.some((c) => c.id === companion.id)
          ? party.map((c) =>
              c.id === companion.id ? { ...c, isRecruited: true } : c,
            )
          : [...party, { ...companion, isRecruited: true, isActive: true }];
        setState({ ...base, player: { ...state.player, party: newParty } });
        MySwal.fire({
          title: `<span style="color:#c9a84c;">¡Nuevo Aliado! ${companion.avatar}</span>`,
          html: `<div style="text-align:center;"><b>${companion.name} (${companion.title})</b> se une a tu equipo.</div>`,
          background: "#1a1a2e",
          color: "#eee",
          confirmButtonColor: "#c9a84c",
        });
      }
      setSelectedNode(null);
      return;
    }

    if (node.type === "altar") {
      setSelectedNode(null);
      MySwal.fire({
        title: "🔮 Altar de la Dualidad",
        text: "Dos corrientes fluyen ante ti. ¿Qué energía canalizas?",
        showCancelButton: true,
        confirmButtonText: "✨ Esencia Celestial",
        cancelButtonText: "🔥 Esencia Infernal",
        background: "#1a1a2e",
        color: "#eee",
        confirmButtonColor: "#4a9eff",
        cancelButtonColor: "#c9551d",
      }).then((res) => {
        const p = state.player;
        if (res.isConfirmed) {
          setState({
            ...base,
            player: {
              ...p,
              stats: { ...p.stats, sanity: Math.min(100, p.stats.sanity + 10) },
              mana: {
                ...p.mana,
                celestial: Math.min(p.mana.maxCelestial, p.mana.celestial + 30),
              },
            },
          });
        } else if (res.dismiss === Swal.DismissReason.cancel) {
          setState({
            ...base,
            player: {
              ...p,
              stats: {
                ...p.stats,
                corruption: Math.min(100, p.stats.corruption + 15),
              },
              mana: {
                ...p.mana,
                infernal: Math.min(p.mana.maxInfernal, p.mana.infernal + 30),
              },
            },
          });
        }
      });
      return;
    }

    // Fallback: evento simple sin escena
    setState(base);
    MySwal.fire({
      title: `📜 ${node.name}`,
      text: node.description,
      background: "#1a1a2e",
      color: "#eee",
      confirmButtonColor: "#c9a84c",
    });
    setSelectedNode(null);
  }

  // Active quest for the chapter
  const chapterQuests = state.quests.filter(
    (q) => q.chapterId === currentChapterId && q.status === "active",
  );
  const mainChapterQuest = chapterQuests.find((q) => q.category === "main");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.gradient,
        padding: "20px",
        color: "#eee",
        fontFamily: "'Georgia', serif",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                background: `linear-gradient(90deg, ${theme.accent}, #eee)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              🗺️ {theme.name}
            </h1>
            {mainChapterQuest && (
              <div style={{ fontSize: 11, color: "#c9a84c88", marginTop: 4 }}>
                📖 Misión activa: {mainChapterQuest.title}
              </div>
            )}
          </div>
          <button
            onClick={onBackToHub}
            style={{
              background: "transparent",
              border: "1px solid #333",
              color: "#888",
              padding: "8px 14px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            ← Volver al Hub
          </button>
        </div>

        {/* Map Legend */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 16,
            padding: "8px 12px",
            background: "#0a0a1588",
            borderRadius: 8,
            border: "1px solid #1a1a2e",
          }}
        >
          {Object.entries(NODE_ICONS).map(([type, icon]) => (
            <span
              key={type}
              style={{
                fontSize: 10,
                color: NODE_BORDER_COLOR[type],
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 13 }}>{icon}</span>{" "}
              {NODE_TYPE_LABEL[type]}
            </span>
          ))}
          <span
            style={{
              fontSize: 10,
              color: "#4ae286",
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginLeft: "auto",
            }}
          >
            ● Completado &nbsp; ◉ Accesible
          </span>
        </div>

        {/* Main Map Area */}
        <div
          style={{
            background: "linear-gradient(180deg, #0d0d1a 0%, #07070f 100%)",
            border: `1px solid ${theme.accent}33`,
            borderRadius: 14,
            padding: "30px 20px",
            position: "relative",
            boxShadow: `0 0 40px ${theme.accent}11`,
            overflow: "hidden",
          }}
        >
          {/* Subtle grid pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.04,
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              pointerEvents: "none",
            }}
          />

          {/* Rows (reversed: row 0 at top of chapter = bottom of screen in column-reverse) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 36,
              position: "relative",
              zIndex: 1,
            }}
          >
            {rows.map((rowNodes, rowIdx) => {
              // Draw connection lines for previous row's connections
              return (
                <div
                  key={rowIdx}
                  style={{ display: "flex", justifyContent: "center", gap: 48 }}
                >
                  {rowNodes.map((node) => {
                    const borderColor = node.completed
                      ? "#4ae286"
                      : node.current
                        ? theme.accent
                        : node.accessible
                          ? NODE_BORDER_COLOR[node.type]
                          : "#222";
                    const glow = node.current
                      ? `0 0 18px ${theme.accent}88`
                      : node.accessible
                        ? `0 0 12px ${NODE_BORDER_COLOR[node.type]}55`
                        : "none";
                    const isSelected = selectedNode?.id === node.id;
                    const isHovered = hoveredNode === node.id;

                    return (
                      <div
                        key={node.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 8,
                          width: 100,
                        }}
                      >
                        {/* Quest indicator above node */}
                        {node.questId && node.accessible && !node.completed && (
                          <div
                            style={{
                              fontSize: 9,
                              color: "#c9a84c",
                              letterSpacing: 0.5,
                              textAlign: "center",
                            }}
                          >
                            📋 Misión
                          </div>
                        )}

                        {/* Node circle */}
                        <div
                          onClick={() => handleSelectNode(node)}
                          onMouseEnter={() => setHoveredNode(node.id)}
                          onMouseLeave={() => setHoveredNode(null)}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background: node.completed
                              ? "linear-gradient(135deg, #0a1f12, #12261a)"
                              : node.current
                                ? `linear-gradient(135deg, #1f1600, #2a2000)`
                                : node.accessible
                                  ? "linear-gradient(135deg, #141428, #1e1e38)"
                                  : "#0d0d14",
                            border: `2px solid ${isSelected ? "#fff" : borderColor}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                            cursor:
                              node.accessible || node.current
                                ? "pointer"
                                : "default",
                            boxShadow: isSelected ? `0 0 24px #fff8` : glow,
                            opacity:
                              node.accessible || node.completed || node.current
                                ? 1
                                : 0.3,
                            transition: "all 0.2s ease",
                            transform:
                              isHovered && (node.accessible || node.current)
                                ? "scale(1.12)"
                                : "scale(1)",
                            position: "relative",
                            flexShrink: 0,
                          }}
                          title={node.name}
                        >
                          {NODE_ICONS[node.type] ?? "📍"}

                          {/* Completed check */}
                          {node.completed && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: -4,
                                right: -4,
                                background: "#4ae286",
                                color: "#000",
                                borderRadius: "50%",
                                width: 18,
                                height: 18,
                                fontSize: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 900,
                              }}
                            >
                              ✓
                            </div>
                          )}

                          {/* Current star */}
                          {node.current && (
                            <div
                              style={{
                                position: "absolute",
                                top: -8,
                                left: "50%",
                                transform: "translateX(-50%)",
                                fontSize: 10,
                                color: theme.accent,
                              }}
                            >
                              ▼
                            </div>
                          )}
                        </div>

                        {/* Name below node */}
                        <div
                          style={{
                            fontSize: 9,
                            color: node.completed
                              ? "#4ae28688"
                              : node.accessible || node.current
                                ? "#ccc"
                                : "#444",
                            textAlign: "center",
                            lineHeight: 1.3,
                            maxWidth: 90,
                            transition: "color 0.2s",
                          }}
                        >
                          {node.name}
                        </div>

                        {/* Type badge */}
                        <div
                          style={{
                            fontSize: 8,
                            padding: "1px 6px",
                            borderRadius: 3,
                            background: `${NODE_BORDER_COLOR[node.type]}22`,
                            color:
                              node.accessible || node.current || node.completed
                                ? NODE_BORDER_COLOR[node.type]
                                : "#333",
                            border: `1px solid ${NODE_BORDER_COLOR[node.type]}33`,
                            letterSpacing: 0.5,
                          }}
                        >
                          {NODE_TYPE_LABEL[node.type]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Panel */}
        {selectedNode && (
          <div
            style={{
              marginTop: 16,
              background: "rgba(15, 15, 30, 0.97)",
              border: `1px solid ${NODE_BORDER_COLOR[selectedNode.type]}`,
              borderRadius: 12,
              padding: "18px 20px",
              boxShadow: `0 0 20px ${NODE_BORDER_COLOR[selectedNode.type]}33`,
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>
                  {NODE_ICONS[selectedNode.type]}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: "#fff" }}>
                    {selectedNode.name}
                  </h3>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 7px",
                      borderRadius: 3,
                      background: `${NODE_BORDER_COLOR[selectedNode.type]}22`,
                      color: NODE_BORDER_COLOR[selectedNode.type],
                      border: `1px solid ${NODE_BORDER_COLOR[selectedNode.type]}44`,
                      letterSpacing: 1,
                    }}
                  >
                    {NODE_TYPE_LABEL[selectedNode.type].toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#555",
                  fontSize: 18,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <p
              style={{
                color: "#bbb",
                fontSize: 13,
                margin: "0 0 14px",
                lineHeight: 1.6,
                fontStyle: "italic",
              }}
            >
              {selectedNode.description}
            </p>

            {/* Related quest */}
            {selectedNode.questId &&
              (() => {
                const quest = state.quests.find(
                  (q) => q.id === selectedNode.questId,
                );
                return quest ? (
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#c9a84c11",
                      border: "1px solid #c9a84c33",
                      borderRadius: 6,
                      marginBottom: 14,
                      fontSize: 11,
                      color: "#c9a84c",
                    }}
                  >
                    📋 Misión relacionada: <strong>{quest.title}</strong>
                  </div>
                ) : null;
              })()}

            <div style={{ display: "flex", gap: 10 }}>
              {selectedNode.accessible && !selectedNode.completed && (
                <button
                  onClick={() => handleExecuteNode(selectedNode)}
                  style={{
                    background: `linear-gradient(135deg, ${NODE_BORDER_COLOR[selectedNode.type]}44, ${NODE_BORDER_COLOR[selectedNode.type]}22)`,
                    border: `1px solid ${NODE_BORDER_COLOR[selectedNode.type]}`,
                    color: "#fff",
                    padding: "10px 20px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    transition: "all 0.2s",
                  }}
                >
                  {selectedNode.type === "combat" ||
                  selectedNode.type === "elite" ||
                  selectedNode.type === "boss"
                    ? "⚔️ Entrar en Combate"
                    : selectedNode.type === "shop"
                      ? "💎 Abrir Tienda"
                      : selectedNode.type === "companion"
                        ? "🤝 Encontrar Aliado"
                        : selectedNode.type === "rest"
                          ? "⛺ Descansar"
                          : selectedNode.type === "altar"
                            ? "🔮 Canalizar Energía"
                            : "📜 Explorar"}
                </button>
              )}
              {selectedNode.completed && (
                <div
                  style={{ fontSize: 12, color: "#4ae286", padding: "10px 0" }}
                >
                  ✓ Esta ubicación ya fue explorada
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
