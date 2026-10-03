import type { MagicElement } from "./magic-element.type";
import type { StatusEffect } from "./status-effect.type";
import type { RuneSelection } from "./rune.type";

export type ManaType = "mana" | "celestial" | "infernal";

export interface Spell {
    id: string;
    name: string;
    element: MagicElement;
    requiredLevel: number; // nivel mínimo en ese elemento
    manaCost: number;
    manaType: ManaType;
    damage?: number;
    heal?: number;
    effects?: StatusEffect[];
    targetType: "self" | "enemy" | "area";
    areaEffect?: boolean;
    description: string;
    comboElements?: MagicElement[]; // hechizos que requieren combinar elementos
    isCombo?: boolean;

    // ── Hechizos forjados en el círculo mágico (ver utils/spell-forge.ts) ──
    /** Si es true, `damage`/`heal`/`manaCost` ya son finales: no se reescalan por nivel ni afinidad */
    forged?: boolean;
    /** Elementos usados (el primero es el dominante) */
    elements?: MagicElement[];
    /** Peso de cada elemento (1 = dominante) para debilidades e inmunidades */
    elementWeights?: Partial<Record<MagicElement, number>>;
    /** Fracción (0-1) de la resistencia mágica del objetivo que se ignora */
    pierce?: number;
    critChance?: number;
    critMult?: number;
    /** Fracción del daño causado que se recupera */
    siphon?: { mana?: number; hp?: number };
    /** Cuánto cambia la corrupción al lanzarlo (+ sube, − baja) */
    corruptionShift?: number;
    /** Runas con las que se forjó */
    runes?: RuneSelection;
}

export interface ComboSpell extends Spell {
    isCombo: true;
    comboElements: MagicElement[];
}
