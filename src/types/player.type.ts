import type { ElementAffinity, ElementLevels } from "./magic-element.type";
import type { EquipmentSlot } from "./equipment.type";

export interface Mana {
    mana: number;
    maxMana: number;
    celestial: number;
    maxCelestial: number;
    infernal: number;
    maxInfernal: number;
}

export interface Stats {
    hp: number;
    maxHp: number;
    physical_strength: number;
    magical_strength: number;
    speed: number;
    resistance: number;
    magicResistance: number;
    corruption: number;
    maxCorruption: number;
    sanity: number;
    maxSanity: number;
    stability: number;
    maxStability: number;
}

export type Role = "mage" | "warrior" | "rogue" | "priest";

export interface PlayerProfile {
    name: string;
    title: string;
    backstory: string;
    type: Role;
    baseStats: Stats;
    baseMana: Mana;
    elementLevels: ElementLevels;
    elementAffinity: ElementAffinity;
    startingSpellIds: string[];
    startingItemIds: string[];
    startingSkillIds: string[];
    startingEquipmentIds?: { id: string; slot: EquipmentSlot }[];
}
