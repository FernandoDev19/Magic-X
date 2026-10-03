import type { Companion } from "../types/companion.type";
import { smallBtn } from "../App";
import { Portrait } from "./Portrait";

interface Props {
    party: Companion[];
    onToggleActive?: (companionId: string) => void;
    onRecruitCompanion?: (companion: Companion) => void;
    isCombat?: boolean;
    onCompanionSkillUse?: (companion: Companion, skillIndex: number) => void;
}

export function CompanionPanel({
    party = [],
    onToggleActive,
    isCombat = false,
    onCompanionSkillUse,
}: Props) {
    if (!party || party.length === 0) {
        return (
            <div
                style={{
                    background: "rgba(20, 20, 35, 0.7)",
                    borderRadius: 8,
                    padding: 12,
                    border: "1px dashed #444",
                    color: "#888",
                    fontSize: 13,
                    textAlign: "center",
                }}
            >
                👥 No tienes compañeros reclutados aún. Explora el mapa y avanza en la historia para encontrar aliados.
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <h4
                    style={{
                        margin: 0,
                        color: "#c9a84c",
                        fontSize: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <span>👥</span> Compañeros de Equipo ({party.filter((c) => c.isRecruited).length})
                </h4>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {party
                    .filter((c) => c.isRecruited)
                    .map((comp) => {
                        const hpPct = Math.max(0, Math.min(100, (comp.stats.hp / comp.stats.maxHp) * 100));
                        const mpPct = Math.max(0, Math.min(100, (comp.mana.mana / comp.mana.maxMana) * 100));

                        return (
                            <div
                                key={comp.id}
                                style={{
                                    background: comp.isActive
                                        ? "linear-gradient(135deg, #1e1e36 0%, #141426 100%)"
                                        : "rgba(15, 15, 25, 0.5)",
                                    border: comp.isActive ? "1px solid #c9a84c" : "1px solid #333",
                                    borderRadius: 8,
                                    padding: 10,
                                    boxShadow: comp.isActive ? "0 0 10px rgba(201, 168, 76, 0.15)" : "none",
                                    opacity: comp.isActive ? 1 : 0.6,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: 6,
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <Portrait name={comp.name} size={34} />
                                        <div>
                                            <div style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>
                                                {comp.name}{comp.stats.hp <= 0 && " 💀"}
                                            </div>
                                            <div style={{ color: "#aaa", fontSize: 10 }}>{comp.title}</div>
                                        </div>
                                    </div>
                                    {!isCombat && onToggleActive && (
                                        <button
                                            onClick={() => onToggleActive(comp.id)}
                                            style={{
                                                ...smallBtn,
                                                fontSize: 10,
                                                padding: "2px 6px",
                                                borderColor: comp.isActive ? "#c9a84c" : "#555",
                                                color: comp.isActive ? "#c9a84c" : "#aaa",
                                            }}
                                        >
                                            {comp.isActive ? "En Grupo" : "Reserva"}
                                        </button>
                                    )}
                                </div>

                                {/* HP Bar */}
                                <div style={{ marginBottom: 4 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: 10,
                                            color: "#aaa",
                                            marginBottom: 2,
                                        }}
                                    >
                                        <span>PV</span>
                                        <span>
                                            {comp.stats.hp}/{comp.stats.maxHp}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            background: "#222",
                                            height: 6,
                                            borderRadius: 3,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${hpPct}%`,
                                                background: hpPct > 30 ? "#4ae286" : "#e24b4a",
                                                height: "100%",
                                                transition: "width 0.3s ease",
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* MP Bar */}
                                <div style={{ marginBottom: 8 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontSize: 10,
                                            color: "#aaa",
                                            marginBottom: 2,
                                        }}
                                    >
                                        <span>Maná</span>
                                        <span>
                                            {comp.mana.mana}/{comp.mana.maxMana}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            background: "#222",
                                            height: 4,
                                            borderRadius: 2,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${mpPct}%`,
                                                background: "#378add",
                                                height: "100%",
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Combat Action Buttons */}
                                {isCombat && comp.isActive && comp.stats.hp > 0 && onCompanionSkillUse && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        {comp.skills.map((skill, sIdx) => (
                                            <button
                                                key={skill.id}
                                                onClick={() => onCompanionSkillUse(comp, sIdx)}
                                                disabled={comp.mana.mana < skill.manaCost}
                                                style={{
                                                    background: "#2a2a4a",
                                                    border: "1px solid #4a4a7a",
                                                    color: comp.mana.mana < skill.manaCost ? "#666" : "#eee",
                                                    fontSize: 11,
                                                    padding: "4px 8px",
                                                    borderRadius: 4,
                                                    cursor: comp.mana.mana < skill.manaCost ? "not-allowed" : "pointer",
                                                    textAlign: "left",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                }}
                                            >
                                                <span>⚡ {skill.name}</span>
                                                <span style={{ color: "#378add" }}>{skill.manaCost} MP</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
