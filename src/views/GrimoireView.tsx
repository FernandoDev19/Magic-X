import { useState } from "react";
import type { Spell } from "../types/spell.type";
import type { ElementLevels } from "../types/magic-element.type";
import { filterActive, filterBtn, gCard, gTitle, spellRow } from "../App";
import { MAGIC_SCHOOLS } from "../data/magic";
import { ALL_SPELLS } from "../data/spells";

type Props = { playerSpells: Spell[]; elementLevels: ElementLevels };

export default function GrimoireView({ playerSpells, elementLevels }: Props) {
    const allSpells = ALL_SPELLS;

    const [filter, setFilter] = useState<string>("all");
    const knownIds = new Set(playerSpells.map((s) => s.id));

    const filtered = allSpells.filter(
        (s) => (filter === "all" || s.element === filter) && !s.isCombo,
    );
    const combos = allSpells.filter(
        (s) =>
            s.isCombo &&
            (filter === "all" || s.comboElements?.includes(filter as any)),
    );

    const ICON: Record<string, string> = {
        fire: "🔥",
        earth: "🪨",
        water: "💧",
        air: "🌪",
        light: "✨",
        darkness: "🌑",
        electric: "⚡",
        vital: "💛",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <button
                    style={{
                        ...filterBtn,
                        ...(filter === "all" ? filterActive : {}),
                    }}
                    onClick={() => setFilter("all")}
                >
                    Todos
                </button>
                {MAGIC_SCHOOLS.map((s) => (
                    <button
                        key={s.element}
                        style={{
                            ...filterBtn,
                            ...(filter === s.element ? filterActive : {}),
                        }}
                        onClick={() => setFilter(s.element)}
                    >
                        {s.icon} {s.name}
                    </button>
                ))}
            </div>

            <div style={gCard}>
                <div style={gTitle}>Hechizos ({filtered.length})</div>
                {filtered.map((spell) => {
                    const known = knownIds.has(spell.id);
                    const playerLvl = elementLevels[spell.element];
                    const locked = playerLvl < spell.requiredLevel;
                    return (
                        <div
                            key={spell.id}
                            style={{ ...spellRow, opacity: locked ? 0.35 : 1 }}
                        >
                            <span style={{ fontSize: 13, width: 18 }}>
                                {ICON[spell.element]}
                            </span>
                            <div style={{ flex: 1 }}>
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: known ? "#c9a84c" : "#ccc",
                                    }}
                                >
                                    {spell.name}
                                </span>
                                {known && (
                                    <span
                                        style={{
                                            fontSize: 9,
                                            color: "#1D9E75",
                                            marginLeft: 6,
                                        }}
                                    >
                                        ✓ aprendido
                                    </span>
                                )}
                                {locked && (
                                    <span
                                        style={{
                                            fontSize: 9,
                                            color: "#E24B4A",
                                            marginLeft: 6,
                                        }}
                                    >
                                        Nv {spell.requiredLevel} req.
                                    </span>
                                )}
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: "#555",
                                        marginTop: 1,
                                    }}
                                >
                                    {spell.description}
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: 10,
                                    color: "#378ADD",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                −{spell.manaCost} {spell.manaType}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div style={gCard}>
                <div style={gTitle}>Hechizos combinados ({combos.length})</div>
                {combos.map((spell) => {
                    const known = knownIds.has(spell.id);
                    const playerLvl = elementLevels[spell.element];
                    const locked = playerLvl < spell.requiredLevel;
                    return (
                        <div
                            key={spell.id}
                            style={{ ...spellRow, opacity: locked ? 0.35 : 1 }}
                        >
                            <span
                                style={{
                                    fontSize: 10,
                                    color: "#7F77DD",
                                    marginRight: 6,
                                }}
                            >
                                {spell.comboElements
                                    ?.map((e) => ICON[e])
                                    .join(" + ")}
                            </span>
                            <div style={{ flex: 1 }}>
                                <span
                                    style={{
                                        fontSize: 11,
                                        color: known ? "#c9a84c" : "#ccc",
                                    }}
                                >
                                    {spell.name}
                                </span>
                                {known && (
                                    <span
                                        style={{
                                            fontSize: 9,
                                            color: "#1D9E75",
                                            marginLeft: 6,
                                        }}
                                    >
                                        ✓ aprendido
                                    </span>
                                )}
                                {locked && (
                                    <span
                                        style={{
                                            fontSize: 9,
                                            color: "#E24B4A",
                                            marginLeft: 6,
                                        }}
                                    >
                                        Nv {spell.requiredLevel} req.
                                    </span>
                                )}
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: "#555",
                                        marginTop: 1,
                                    }}
                                >
                                    {spell.description}
                                </div>
                            </div>
                            <span
                                style={{
                                    fontSize: 10,
                                    color: "#378ADD",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                −{spell.manaCost} {spell.manaType}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
