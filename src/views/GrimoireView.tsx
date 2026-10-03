import { useState } from "react";
import type { Spell } from "../types/spell.type";
import type { ElementLevels } from "../types/magic-element.type";
import { filterActive, filterBtn, gCard, gTitle } from "../App";
import { MAGIC_SCHOOLS, getSchool } from "../data/magic";
import { getRune } from "../data/runes";
import type { SpellRecipe } from "../types/rune.type";
import { forgeName } from "../utils/spell-forge";

type Props = { playerSpells: Spell[]; elementLevels: ElementLevels; recipes?: SpellRecipe[] };

const SOURCE_LABEL: Record<string, string> = {
    crafted: "Forjada por ti", found: "Encontrada", bought: "Comprada", story: "Heredada",
};

export default function GrimoireView({ playerSpells, elementLevels, recipes = [] }: Props) {
    const [filter, setFilter] = useState<string>("all");

    // Mostrar solo los hechizos que el jugador conoce
    const knownSpells = playerSpells ?? [];

    const filtered = knownSpells.filter(
        (s) => (filter === "all" || s.element === filter) && !s.isCombo,
    );
    const combos = knownSpells.filter(
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

    const COLOR: Record<string, string> = {
        fire: "#E24B4A",
        earth: "#E89F5B",
        water: "#378ADD",
        air: "#85B7EB",
        light: "#FAC775",
        darkness: "#9A63D4",
        electric: "#FAC775",
        vital: "#5DCAA5",
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeIn 0.3s ease" }}>
            {/* Categorías / Filtros */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button
                    style={{
                        ...filterBtn,
                        ...(filter === "all" ? filterActive : {}),
                    }}
                    onClick={() => setFilter("all")}
                >
                    Todos ({knownSpells.length})
                </button>
                {MAGIC_SCHOOLS.map((s) => {
                    const count = knownSpells.filter(
                        (sp) => sp.element === s.element || sp.comboElements?.includes(s.element as any)
                    ).length;
                    return (
                        <button
                            key={s.element}
                            style={{
                                ...filterBtn,
                                ...(filter === s.element ? filterActive : {}),
                                opacity: count > 0 ? 1 : 0.5,
                            }}
                            onClick={() => setFilter(s.element)}
                        >
                            {s.icon} {s.name} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Recetas del círculo mágico */}
            <div style={gCard}>
                <div style={{ ...gTitle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>🔮 Recetas del Círculo ({recipes.length})</span>
                    <span style={{ fontSize: 11, color: "#888", fontWeight: "normal" }}>
                        Elementos + Sujeto + Vector + Forma
                    </span>
                </div>
                {recipes.length === 0 ? (
                    <div style={{ padding: "16px 0", textAlign: "center", color: "#666", fontSize: 13, fontStyle: "italic" }}>
                        Aún no tienes recetas. Fórjalas en combate con el círculo mágico, o encuéntralas explorando.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                        {recipes.map((r) => (
                            <div key={r.id} style={{ background: "#12122a", border: "1px solid #c9a84c33", borderLeft: "4px solid #c9a84c", borderRadius: 6, padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 14 }}>{r.elements.map((e) => getSchool(e).icon).join("")}</span>
                                    <span style={{ fontSize: 13, fontWeight: "bold", color: "#fff" }}>{forgeName(r)}</span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#888" }}>
                                    <span title="Sujeto · Vector · Forma" style={{ color: "#c9a84c" }}>
                                        {[r.subject, r.vector, r.form].map((id) => getRune(id)?.name ?? id).join(" · ")}
                                    </span>
                                    <span>{SOURCE_LABEL[r.source ?? "crafted"]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Hechizos conocidos */}
            <div style={gCard}>
                <div style={{ ...gTitle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>📜 Hechizos Conocidos ({filtered.length})</span>
                    <span style={{ fontSize: 11, color: "#888", fontWeight: "normal" }}>
                        Demuestran tu maestría elemental
                    </span>
                </div>

                {filtered.length === 0 ? (
                    <div style={{ padding: "20px 0", textAlign: "center", color: "#666", fontSize: 13, fontStyle: "italic" }}>
                        No posees hechizos conocidos en esta categoría.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                        {filtered.map((spell) => {
                            const elemColor = COLOR[spell.element] ?? "#c9a84c";
                            const playerLvl = elementLevels[spell.element] ?? 0;
                            return (
                                <div
                                    key={spell.id}
                                    style={{
                                        background: "#12122a",
                                        border: `1px solid ${elemColor}33`,
                                        borderLeft: `4px solid ${elemColor}`,
                                        borderRadius: 6,
                                        padding: "10px 14px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 4,
                                        transition: "transform 0.15s, border-color 0.15s",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 16 }}>{ICON[spell.element]}</span>
                                            <span style={{ fontSize: 13, fontWeight: "bold", color: "#fff" }}>
                                                {spell.name}
                                            </span>
                                            <span style={{ fontSize: 10, color: "#1D9E75", background: "#1D9E7522", padding: "1px 6px", borderRadius: 4 }}>
                                                ✓ Aprendido
                                            </span>
                                            {spell.areaEffect && (
                                                <span style={{ fontSize: 10, color: "#E24B4A", background: "#E24B4A22", padding: "1px 6px", borderRadius: 4 }}>
                                                    🎯 Área (AOE)
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            {spell.damage && (
                                                <span style={{ fontSize: 11, color: "#E24B4A", fontWeight: "bold" }}>
                                                    ⚔️ {spell.damage} daño
                                                </span>
                                            )}
                                            {spell.heal && (
                                                <span style={{ fontSize: 11, color: "#5DCAA5", fontWeight: "bold" }}>
                                                    ❤️ +{spell.heal} PV
                                                </span>
                                            )}
                                            <span style={{ fontSize: 11, color: "#378ADD", background: "#378ADD1a", padding: "2px 8px", borderRadius: 4, fontWeight: "bold" }}>
                                                −{spell.manaCost} {spell.manaType}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5, marginTop: 2 }}>
                                        {spell.description}
                                    </div>

                                    <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#666", marginTop: 2 }}>
                                        <span>Requisito: Nivel {spell.requiredLevel} ({spell.element})</span>
                                        <span>Nivel actual: <strong style={{ color: elemColor }}>{playerLvl}</strong></span>
                                        <span>Objetivo: {spell.targetType === "area" ? "Todos los enemigos" : spell.targetType === "enemy" ? "Un enemigo" : "Uno mismo"}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Combinaciones */}
            <div style={gCard}>
                <div style={{ ...gTitle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>🔮 Combinaciones Conocidas ({combos.length})</span>
                    <span style={{ fontSize: 11, color: "#888", fontWeight: "normal" }}>
                        Magia híbrida avanzada
                    </span>
                </div>

                {combos.length === 0 ? (
                    <div style={{ padding: "16px 0", textAlign: "center", color: "#666", fontSize: 13, fontStyle: "italic" }}>
                        No posees magias combinadas aprendidas en esta categoría.
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                        {combos.map((spell) => {
                            return (
                                <div
                                    key={spell.id}
                                    style={{
                                        background: "#12122a",
                                        border: "1px solid #7F77DD44",
                                        borderLeft: "4px solid #7F77DD",
                                        borderRadius: 6,
                                        padding: "10px 14px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 4,
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 12, color: "#7F77DD", fontWeight: "bold" }}>
                                                {spell.comboElements?.map((e) => ICON[e]).join(" + ")}
                                            </span>
                                            <span style={{ fontSize: 13, fontWeight: "bold", color: "#fff" }}>
                                                {spell.name}
                                            </span>
                                            <span style={{ fontSize: 10, color: "#1D9E75", background: "#1D9E7522", padding: "1px 6px", borderRadius: 4 }}>
                                                ✓ Aprendido
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            {spell.damage && (
                                                <span style={{ fontSize: 11, color: "#E24B4A", fontWeight: "bold" }}>
                                                    ⚔️ {spell.damage} daño
                                                </span>
                                            )}
                                            {spell.heal && (
                                                <span style={{ fontSize: 11, color: "#5DCAA5", fontWeight: "bold" }}>
                                                    ❤️ +{spell.heal} PV
                                                </span>
                                            )}
                                            <span style={{ fontSize: 11, color: "#378ADD", background: "#378ADD1a", padding: "2px 8px", borderRadius: 4, fontWeight: "bold" }}>
                                                −{spell.manaCost} {spell.manaType}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5, marginTop: 2 }}>
                                        {spell.description}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

