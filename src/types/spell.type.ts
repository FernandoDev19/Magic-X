import type { MagicElement } from "./magic-element.type";
import type { StatusEffect } from "./status-effect.type";

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
}

export interface ComboSpell extends Spell {
    isCombo: true;
    comboElements: MagicElement[];
}
