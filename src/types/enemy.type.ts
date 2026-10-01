import type { MagicElement } from "./magic-element.type";
import type { StatusEffect } from "./status-effect.type";

export interface Enemy {
    id: string;
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    physical_strength: number;
    magical_strength: number;
    resistance: number;
    magicResistance: number;
    speed: number;
    element: MagicElement;
    weakness?: MagicElement; // recibe +50% daño
    immunity?: MagicElement; // inmune a ese elemento
    statusEffects: StatusEffect[];
    spells: string[];
    skills: string[];
    xpReward: number;
    lootTable?: string[]; // ids de ítems posibles
}
