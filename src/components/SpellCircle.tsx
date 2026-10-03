import { useMemo, useState } from "react";
import type { Enemy } from "../types/enemy.type";
import type { MagicElement } from "../types/magic-element.type";
import type { Mana } from "../types/player.type";
import type { FormId, Rune, RuneCategory, SpellRecipe, SubjectId, VectorId } from "../types/rune.type";
import { MAGIC_SCHOOLS, getSchool } from "../data/magic";
import {
    ELEMENT_NODES,
    FORM_RUNES,
    OCTAGRAM_ASPECT,
    OCTAGRAM_IMAGE,
    SUBJECT_RUNES,
    VECTOR_RUNES,
    getRune,
    isRuneUnlocked,
    maxElementsFor,
} from "../data/runes";
import { canCast, computeAbilityDamage } from "../utils/combat";
import { forgeName, forgeSpell, makeRecipe, recipeId, type ForgeContext, type ForgedSpell } from "../utils/spell-forge";

interface Props {
    ctx: ForgeContext;
    mana: Mana;
    playerLevel: number;
    flags: Record<string, boolean | number>;
    recipes: SpellRecipe[];
    /** Enemigo objetivo actual (para la vista previa de daño) */
    target: Enemy | null;
    isPlayerTurn: boolean;
    onCast: (forged: ForgedSpell, recipe: SpellRecipe) => void;
    onSaveRecipe: (recipe: SpellRecipe) => void;
    onClose: () => void;
}

const MANA_COLOR: Record<string, string> = { mana: "#378ADD", celestial: "#FAC775", infernal: "#7F77DD" };
const MANA_LABEL: Record<string, string> = { mana: "Maná", celestial: "Celestial", infernal: "Infernal" };

export function SpellCircle({
    ctx, mana, playerLevel, flags, recipes, target, isPlayerTurn, onCast, onSaveRecipe, onClose,
}: Props) {
    const [elements, setElements] = useState<MagicElement[]>([]);
    const [subject, setSubject] = useState<SubjectId | null>(null);
    const [vector, setVector] = useState<VectorId | null>(null);
    const [form, setForm] = useState<FormId | null>(null);
    const [hint, setHint] = useState<string | null>(null);

    const maxEl = maxElementsFor(playerLevel);
    const complete = elements.length > 0 && subject && vector && form;

    const forged = useMemo<ForgedSpell | null>(() => {
        if (!elements.length || !subject || !vector || !form) return null;
        return forgeSpell({ elements, subject, vector, form }, ctx);
    }, [elements, subject, vector, form, ctx]);

    const recipe = forged ? makeRecipe({ elements, subject: subject!, vector: vector!, form: form! }) : null;
    const alreadySaved = recipe ? recipes.some((r) => r.id === recipe.id) : false;

    function toggleElement(el: MagicElement) {
        setHint(null);
        if (elements.includes(el)) return setElements(elements.filter((e) => e !== el));
        if (elements.length >= maxEl) return setHint(`Solo puedes combinar ${maxEl} elementos a la vez.`);
        setElements([...elements, el]);
    }

    function clearAll() {
        setElements([]); setSubject(null); setVector(null); setForm(null); setHint(null);
    }

    function loadRecipe(r: SpellRecipe) {
        setElements(r.elements); setSubject(r.subject); setVector(r.vector); setForm(r.form); setHint(null);
    }

    function recipeUnlocked(r: SpellRecipe) {
        return [r.subject, r.vector, r.form].every((id) => {
            const rune = getRune(id);
            return rune ? isRuneUnlocked(rune, playerLevel, flags) : false;
        });
    }

    // Vista previa
    let castBlock: string | null = null;
    let estimate: number | null = null;
    if (forged) {
        const s = forged.spell;
        if (!isPlayerTurn) castBlock = "No es tu turno.";
        else if (s.targetType !== "self" && !target) castBlock = "No hay objetivo.";
        else if (!canCast(s, mana, ctx.elementLevels, ctx.elementAffinity)) {
            castBlock = `${MANA_LABEL[s.manaType]} insuficiente.`;
        }
        if (s.damage) {
            estimate = target
                ? computeAbilityDamage(s, ctx.elementLevels, target, ctx.stats.magical_strength, ctx.stats.physical_strength, true).dmg
                : s.damage;
        }
    }

    function runeRow(title: string, category: RuneCategory, runes: Rune[], value: string | null, set: (id: never) => void) {
        const selected = runes.find((r) => r.id === value);
        return (
            <div style={{ marginBottom: 10 }}>
                <div style={sectionTitle}>{title}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {runes.map((r) => {
                        const unlocked = isRuneUnlocked(r, playerLevel, flags);
                        const on = value === r.id;
                        return (
                            <button
                                key={r.id}
                                disabled={!unlocked}
                                title={unlocked ? r.description : `Se desbloquea al nivel ${r.unlockLevel}${r.unlockable ? " o por la historia" : ""}`}
                                onClick={() => set((on ? null : r.id) as never)}
                                data-category={category}
                                style={{
                                    ...runeBtn,
                                    borderColor: on ? "#c9a84c" : "#2a2a4a",
                                    background: on ? "#c9a84c22" : "#12122a",
                                    color: on ? "#c9a84c" : unlocked ? "#ccc" : "#555",
                                    opacity: unlocked ? 1 : 0.55,
                                    cursor: unlocked ? "pointer" : "not-allowed",
                                }}
                            >
                                <span style={{ fontSize: 16, lineHeight: 1 }}>{r.glyph}</span>
                                <span style={{ fontWeight: 700, fontSize: 11 }}>{r.name}</span>
                                <span style={{ fontSize: 9, color: "#888" }}>{unlocked ? r.meaning : `🔒 Nv${r.unlockLevel}`}</span>
                            </button>
                        );
                    })}
                </div>
                {selected && <div style={runeDesc}>{selected.description}</div>}
            </div>
        );
    }

    return (
        <div style={overlay} onClick={onClose}>
            <div style={panel} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                        <div style={{ color: "#c9a84c", fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>🔮 CÍRCULO MÁGICO</div>
                        <div style={{ color: "#777", fontSize: 10 }}>
                            Elementos + Sujeto + Vector + Forma
                        </div>
                    </div>
                    <button onClick={onClose} style={closeBtn} title="Cerrar">✕</button>
                </div>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                    {/* ── Octagrama ── */}
                    <div style={{ flex: "1 1 280px", maxWidth: 380, minWidth: 260 }}>
                        <div style={{ ...sectionTitle, textAlign: "center" }}>
                            1 · ELEMENTOS ({elements.length}/{maxEl})
                        </div>
                        <div style={{ position: "relative", width: "100%", aspectRatio: String(OCTAGRAM_ASPECT), borderRadius: 8, overflow: "hidden", boxShadow: "0 0 24px #c9a84c22" }}>
                            <img src={OCTAGRAM_IMAGE} alt="Círculo mágico" draggable={false}
                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", userSelect: "none" }} />

                            {ELEMENT_NODES.map((node) => {
                                const school = getSchool(node.element);
                                const order = elements.indexOf(node.element);
                                const on = order !== -1;
                                return (
                                    <button
                                        key={node.element}
                                        onClick={() => toggleElement(node.element)}
                                        title={`${school.name} — ${school.description}`}
                                        style={{
                                            position: "absolute", left: `${node.x}%`, top: `${node.y}%`,
                                            transform: "translate(-50%, -50%)",
                                            width: "17%", aspectRatio: "1", borderRadius: "50%", padding: 0,
                                            border: on ? `2px solid ${school.color}` : "1px solid #00000033",
                                            background: on
                                                ? `radial-gradient(circle, ${school.color}cc 0%, ${school.color}55 60%, transparent 100%)`
                                                : "radial-gradient(circle, #f5e6c8aa 0%, #f5e6c855 70%, transparent 100%)",
                                            boxShadow: on ? `0 0 16px ${school.color}` : "none",
                                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "clamp(14px, 3.6vw, 22px)", transition: "all 0.15s",
                                        }}
                                    >
                                        <span style={{ filter: "drop-shadow(0 1px 2px #000)" }}>{school.icon}</span>
                                        {on && <span style={{ ...badge, background: school.color }}>{order + 1}</span>}
                                    </button>
                                );
                            })}

                            {/* Centro: limpiar */}
                            <button
                                onClick={clearAll}
                                title="Limpiar el círculo"
                                style={{
                                    position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
                                    width: "16%", aspectRatio: "1", borderRadius: "50%", border: "none",
                                    background: elements.length ? "radial-gradient(circle, #c9a84ccc, #c9a84c22 75%)" : "transparent",
                                    color: "#5a1010", fontSize: 18, cursor: "pointer", fontWeight: 700,
                                }}
                            >
                                {elements.length ? "✦" : ""}
                            </button>
                        </div>
                        <div style={{ minHeight: 18, marginTop: 6, textAlign: "center", fontSize: 10, color: hint ? "#EF9F27" : "#666" }}>
                            {hint ?? "El primer elemento es el dominante. Los opuestos chocan: potentes, pero inestables."}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: 4 }}>
                            {MAGIC_SCHOOLS.map((s) => (
                                <span key={s.element} style={{ fontSize: 9, color: s.color }}>
                                    {s.icon} {s.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ── Runas + vista previa ── */}
                    <div style={{ flex: "1 1 300px", minWidth: 280 }}>
                        {runeRow("2 · SUJETO — ¿quién?", "subject", SUBJECT_RUNES, subject, setSubject as (id: never) => void)}
                        {runeRow("3 · VECTOR — ¿hacia dónde?", "vector", VECTOR_RUNES, vector, setVector as (id: never) => void)}
                        {runeRow("4 · FORMA — ¿cómo?", "form", FORM_RUNES, form, setForm as (id: never) => void)}

                        <div style={previewBox}>
                            {!forged ? (
                                <div style={{ color: "#666", fontStyle: "italic", fontSize: 11 }}>
                                    {elements.length === 0 ? "Elige al menos un elemento en el círculo." : !subject ? "Elige un sujeto." : !vector ? "Elige un vector." : "Elige una forma."}
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                                        <span style={{ color: "#c9a84c", fontWeight: 700, fontSize: 14 }}>{forged.spell.name}</span>
                                        <span style={{ color: MANA_COLOR[forged.spell.manaType], fontWeight: 700, fontSize: 12 }}>
                                            {forged.spell.manaCost} {MANA_LABEL[forged.spell.manaType]}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", margin: "6px 0" }}>
                                        {estimate !== null && (
                                            <span style={{ ...tag, color: "#ff6b6b" }}>
                                                ⚔ ~{estimate}{forged.spell.areaEffect ? " c/u" : ""}
                                            </span>
                                        )}
                                        {forged.spell.heal ? <span style={{ ...tag, color: "#5DCAA5" }}>❤ +{forged.spell.heal}</span> : null}
                                        {forged.spell.critChance ? <span style={{ ...tag, color: "#FAC775" }}>✦ Crit {Math.round(forged.spell.critChance * 100)}%</span> : null}
                                        {forged.spell.pierce ? <span style={{ ...tag, color: "#AFA9EC" }}>⟁ Perfora {Math.round(forged.spell.pierce * 100)}%</span> : null}
                                        <span style={{ ...tag, color: forged.instability > 0.25 ? "#E24B4A" : forged.instability > 0 ? "#EF9F27" : "#5DCAA5" }}>
                                            {forged.instability > 0 ? `⚠ Inestable ${Math.round(forged.instability * 100)}%` : "✓ Estable"}
                                        </span>
                                    </div>
                                    {forged.spell.effects && (
                                        <div style={{ fontSize: 10, color: "#AFA9EC", marginBottom: 4 }}>
                                            ✨ {forged.spell.effects.map((e) => `${e.type} (${e.duration}t${e.value ? `, ${e.value}` : ""})`).join(" · ")}
                                        </div>
                                    )}
                                    {forged.notes.map((n, i) => (
                                        <div key={i} style={{ fontSize: 10, color: "#999" }}>{n}</div>
                                    ))}
                                    <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
                                        🎯 {forged.spell.areaEffect ? "Todos los enemigos" : forged.spell.targetType === "self" ? "Tú" : (target?.name ?? "Sin objetivo")}
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                            <button
                                disabled={!complete || !!castBlock}
                                onClick={() => forged && recipe && onCast(forged, recipe)}
                                style={{ ...mainBtn, opacity: !complete || castBlock ? 0.4 : 1, cursor: !complete || castBlock ? "not-allowed" : "pointer" }}
                            >
                                🔮 Lanzar
                            </button>
                            <button
                                disabled={!complete || alreadySaved}
                                onClick={() => recipe && onSaveRecipe(recipe)}
                                style={{ ...subBtn, opacity: !complete || alreadySaved ? 0.4 : 1 }}
                            >
                                {alreadySaved ? "📖 En el grimorio" : "📖 Guardar receta"}
                            </button>
                            <button onClick={clearAll} style={subBtn}>Limpiar</button>
                        </div>
                        {castBlock && complete && <div style={{ fontSize: 10, color: "#E24B4A", marginTop: 4 }}>{castBlock}</div>}
                    </div>
                </div>

                {/* ── Recetas ── */}
                <div style={{ marginTop: 14, borderTop: "1px solid #2a2a4a", paddingTop: 10 }}>
                    <div style={sectionTitle}>📖 RECETAS DEL GRIMORIO ({recipes.length})</div>
                    {recipes.length === 0 ? (
                        <div style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>
                            Aún no tienes recetas. Forja un hechizo y guárdalo; también las encontrarás explorando o en la historia.
                        </div>
                    ) : (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxHeight: 110, overflowY: "auto" }}>
                            {recipes.map((r) => {
                                const unlocked = recipeUnlocked(r);
                                const active = recipe?.id === r.id || recipeId(r) === recipe?.id;
                                return (
                                    <button
                                        key={r.id}
                                        disabled={!unlocked}
                                        onClick={() => loadRecipe(r)}
                                        title={unlocked ? "Cargar receta" : "Usa runas que aún no has desbloqueado"}
                                        style={{
                                            ...recipeBtn,
                                            borderColor: active ? "#c9a84c" : "#2a2a4a",
                                            opacity: unlocked ? 1 : 0.45,
                                            cursor: unlocked ? "pointer" : "not-allowed",
                                        }}
                                    >
                                        <span>{r.elements.map((e) => getSchool(e).icon).join("")}</span>
                                        <span style={{ fontSize: 11, color: "#ddd" }}>{forgeName(r)}</span>
                                        <span style={{ fontSize: 9, color: "#888" }}>
                                            {[r.subject, r.vector, r.form].map((id) => getRune(id)?.glyph).join(" ")}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Estilos ───────────────────────────────────────────────────────────────
const overlay: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 50, background: "rgba(3,3,10,0.82)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 12, animation: "fadeIn 0.2s ease",
};
const panel: React.CSSProperties = {
    width: "min(940px, 100%)", maxHeight: "94vh", overflowY: "auto",
    background: "linear-gradient(180deg, #16162e, #0d0d1a)", border: "1px solid #c9a84c66",
    borderRadius: 12, padding: 16, fontFamily: "Georgia, serif", color: "#ddd",
};
const sectionTitle: React.CSSProperties = { fontSize: 10, letterSpacing: 1.5, color: "#c9a84c99", marginBottom: 6 };
const closeBtn: React.CSSProperties = {
    background: "transparent", border: "1px solid #333", color: "#888", borderRadius: 6,
    padding: "2px 9px", cursor: "pointer", fontSize: 14,
};
const runeBtn: React.CSSProperties = {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 64,
    border: "1px solid #2a2a4a", borderRadius: 8, padding: "5px 8px", fontFamily: "Georgia, serif",
};
const runeDesc: React.CSSProperties = { fontSize: 10, color: "#999", marginTop: 5, lineHeight: 1.4, fontStyle: "italic" };
const previewBox: React.CSSProperties = {
    background: "#0d0d1a", border: "1px solid #c9a84c44", borderRadius: 8, padding: 10, minHeight: 76,
};
const tag: React.CSSProperties = { fontSize: 10, fontWeight: 700, background: "#ffffff0d", padding: "1px 6px", borderRadius: 3 };
const badge: React.CSSProperties = {
    position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%",
    color: "#000", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
};
const mainBtn: React.CSSProperties = {
    background: "linear-gradient(135deg, #c9a84c, #a8872f)", color: "#000", border: "none", borderRadius: 7,
    padding: "8px 20px", fontSize: 13, fontWeight: 700, fontFamily: "Georgia, serif",
};
const subBtn: React.CSSProperties = {
    background: "transparent", color: "#ccc", border: "1px solid #444", borderRadius: 7,
    padding: "8px 12px", fontSize: 11, cursor: "pointer", fontFamily: "Georgia, serif",
};
const recipeBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6, background: "#12122a", border: "1px solid #2a2a4a",
    borderRadius: 6, padding: "4px 8px", fontFamily: "Georgia, serif",
};
