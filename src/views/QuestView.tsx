import type { Quest } from "../types/quest.type";
import type { GameState } from "../types/game-state";

interface Props {
    state: GameState;
    onBack: () => void;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    main: { label: "Principal", color: "#c9a84c", icon: "📖" },
    secondary: { label: "Secundaria", color: "#7F77DD", icon: "📜" },
    exploration: { label: "Exploración", color: "#5DCAA5", icon: "🗺️" },
    companion: { label: "Compañero", color: "#E89F5B", icon: "🤝" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: "Activa", color: "#5DCAA5" },
    completed: { label: "Completada", color: "#4ae286" },
    failed: { label: "Fallida", color: "#E24B4A" },
    locked: { label: "Bloqueada", color: "#555" },
};

function QuestCard({ quest }: { quest: Quest }) {
    const cat = CATEGORY_LABELS[quest.category];
    const status = STATUS_LABELS[quest.status];
    const completedObjectives = quest.objectives.filter(o => o.completed).length;
    const progress = quest.objectives.length > 0
        ? completedObjectives / quest.objectives.length
        : 0;

    return (
        <div style={{
            background: quest.status === "locked" ? "#0d0d1a" : "#10102088",
            border: `1px solid ${quest.status === "active" ? cat.color + "44" : "#1a1a2e"}`,
            borderLeft: `3px solid ${quest.status === "locked" ? "#333" : cat.color}`,
            borderRadius: 8,
            padding: "14px 16px",
            opacity: quest.status === "locked" ? 0.5 : 1,
            transition: "all 0.2s",
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{quest.icon}</span>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: quest.status === "locked" ? "#555" : "#eee" }}>
                            {quest.title}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                            <span style={{
                                fontSize: 9,
                                letterSpacing: 1,
                                padding: "1px 6px",
                                borderRadius: 3,
                                background: cat.color + "22",
                                color: cat.color,
                                border: `1px solid ${cat.color}33`,
                            }}>
                                {cat.icon} {cat.label.toUpperCase()}
                            </span>
                            <span style={{
                                fontSize: 9,
                                letterSpacing: 1,
                                padding: "1px 6px",
                                borderRadius: 3,
                                background: status.color + "22",
                                color: status.color,
                                border: `1px solid ${status.color}33`,
                            }}>
                                {status.label.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <p style={{ fontSize: 11, color: "#aaa", lineHeight: 1.5, margin: "0 0 10px" }}>
                {quest.description}
            </p>

            {/* Objectives */}
            {quest.status !== "locked" && (
                <div style={{ marginBottom: 10 }}>
                    {quest.objectives.map(obj => (
                        <div key={obj.id} style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                            marginBottom: 4,
                        }}>
                            <span style={{
                                fontSize: 12,
                                color: obj.completed ? "#4ae286" : "#666",
                                flexShrink: 0,
                                marginTop: 1,
                            }}>
                                {obj.completed ? "✓" : "◻"}
                            </span>
                            <span style={{
                                fontSize: 11,
                                color: obj.completed ? "#4ae286aa" : "#999",
                                textDecoration: obj.completed ? "line-through" : "none",
                                lineHeight: 1.4,
                            }}>
                                {obj.description}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Progress bar */}
            {quest.status === "active" && quest.objectives.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                    <div style={{
                        height: 4,
                        background: "#1a1a2e",
                        borderRadius: 2,
                        overflow: "hidden",
                    }}>
                        <div style={{
                            height: "100%",
                            width: `${progress * 100}%`,
                            background: `linear-gradient(90deg, ${cat.color}, ${cat.color}99)`,
                            borderRadius: 2,
                            transition: "width 0.4s",
                        }} />
                    </div>
                    <div style={{ fontSize: 9, color: "#555", marginTop: 3, letterSpacing: 1 }}>
                        {completedObjectives}/{quest.objectives.length} objetivos
                    </div>
                </div>
            )}

            {/* Reward */}
            {quest.reward && quest.status !== "locked" && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px",
                    background: "#1a1a2e",
                    borderRadius: 4,
                }}>
                    <span style={{ fontSize: 10 }}>🎁</span>
                    <span style={{ fontSize: 10, color: "#c9a84c" }}>{quest.reward.description}</span>
                </div>
            )}
        </div>
    );
}

export default function QuestView({ state, onBack }: Props) {
    const quests = state.quests;
    const activeMain = quests.filter(q => q.category === "main" && q.status !== "locked");
    const activeSecondary = quests.filter(q => q.category === "secondary" && q.status !== "locked");
    const activeExploration = quests.filter(q => q.category === "exploration" && q.status !== "locked");
    const activeCompanion = quests.filter(q => q.category === "companion" && q.status !== "locked");
    const locked = quests.filter(q => q.status === "locked");

    const completedCount = quests.filter(q => q.status === "completed").length;
    const totalActive = quests.filter(q => q.status === "active").length;

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(160deg, #05050f 0%, #0d0921 50%, #05050f 100%)",
            padding: "24px 20px",
            color: "#eee",
        }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div>
                        <h1 style={{
                            margin: 0,
                            fontSize: 22,
                            fontWeight: 800,
                            background: "linear-gradient(90deg, #c9a84c, #e8c96e)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            letterSpacing: 1,
                        }}>
                            📋 DIARIO DE MISIONES
                        </h1>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
                            {totalActive} activas · {completedCount} completadas · {locked.length} bloqueadas
                        </div>
                    </div>
                    <button
                        onClick={onBack}
                        style={{
                            background: "transparent",
                            border: "1px solid #333",
                            color: "#888",
                            padding: "8px 16px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 12,
                        }}
                    >
                        ← Volver al Hub
                    </button>
                </div>

                {/* MAIN QUESTS */}
                {activeMain.length > 0 && (
                    <section style={{ marginBottom: 24 }}>
                        <h2 style={{
                            fontSize: 11,
                            letterSpacing: 2,
                            color: "#c9a84c",
                            textTransform: "uppercase",
                            margin: "0 0 10px",
                            borderBottom: "1px solid #c9a84c22",
                            paddingBottom: 6,
                        }}>
                            📖 Misiones Principales
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {activeMain.map(q => <QuestCard key={q.id} quest={q} />)}
                        </div>
                    </section>
                )}

                {/* SECONDARY QUESTS */}
                {activeSecondary.length > 0 && (
                    <section style={{ marginBottom: 24 }}>
                        <h2 style={{
                            fontSize: 11,
                            letterSpacing: 2,
                            color: "#7F77DD",
                            textTransform: "uppercase",
                            margin: "0 0 10px",
                            borderBottom: "1px solid #7F77DD22",
                            paddingBottom: 6,
                        }}>
                            📜 Misiones Secundarias
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {activeSecondary.map(q => <QuestCard key={q.id} quest={q} />)}
                        </div>
                    </section>
                )}

                {/* EXPLORATION QUESTS */}
                {activeExploration.length > 0 && (
                    <section style={{ marginBottom: 24 }}>
                        <h2 style={{
                            fontSize: 11,
                            letterSpacing: 2,
                            color: "#5DCAA5",
                            textTransform: "uppercase",
                            margin: "0 0 10px",
                            borderBottom: "1px solid #5DCAA522",
                            paddingBottom: 6,
                        }}>
                            🗺️ Misiones de Exploración
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {activeExploration.map(q => <QuestCard key={q.id} quest={q} />)}
                        </div>
                    </section>
                )}

                {/* COMPANION QUESTS */}
                {activeCompanion.length > 0 && (
                    <section style={{ marginBottom: 24 }}>
                        <h2 style={{
                            fontSize: 11,
                            letterSpacing: 2,
                            color: "#E89F5B",
                            textTransform: "uppercase",
                            margin: "0 0 10px",
                            borderBottom: "1px solid #E89F5B22",
                            paddingBottom: 6,
                        }}>
                            🤝 Misiones de Compañeros
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {activeCompanion.map(q => <QuestCard key={q.id} quest={q} />)}
                        </div>
                    </section>
                )}

                {/* LOCKED */}
                {locked.length > 0 && (
                    <section>
                        <h2 style={{
                            fontSize: 11,
                            letterSpacing: 2,
                            color: "#444",
                            textTransform: "uppercase",
                            margin: "0 0 10px",
                            borderBottom: "1px solid #1a1a2e",
                            paddingBottom: 6,
                        }}>
                            🔒 Bloqueadas (capítulos siguientes)
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {locked.map(q => <QuestCard key={q.id} quest={q} />)}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
