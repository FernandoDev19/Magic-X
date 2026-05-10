/**
 * Sistema de equipamiento de Magic X
 *
 * Slots disponibles:
 *  - mainHand:  Arma principal (1 mano o 2 manos)
 *  - offHand:   Mano secundaria (escudo, arma secundaria) — bloqueado si mainHand es 2 manos
 *  - armor:     Armadura / ropa
 *  - accessory1, accessory2: Accesorios (anillos, amuletos, etc.)
 */

export type EquipmentSlot = "mainHand" | "offHand" | "armor" | "accessory1" | "accessory2";

export type WeaponGrip = "one-handed" | "two-handed";

export type EquipmentCategory = "weapon" | "shield" | "armor" | "accessory";

/** Bonificaciones planas que el equipo aporta a las stats del jugador */
export interface EquipmentBonuses {
    physical_strength?: number;
    magical_strength?: number;
    resistance?: number;
    magicResistance?: number;
    speed?: number;
    maxHp?: number;
    maxMana?: number;
    maxCelestial?: number;
    maxInfernal?: number;
}

export interface EquipmentItem {
    id: string;
    name: string;
    icon: string;
    description: string;
    category: EquipmentCategory;
    /** En qué slot(s) puede equiparse */
    validSlots: EquipmentSlot[];
    /** Solo para armas */
    grip?: WeaponGrip;
    /** Bonificaciones pasivas al equipar */
    bonuses: EquipmentBonuses;
    /** Nivel mínimo de XP o nivel de elemento para equipar (opcional) */
    requiredLevel?: number;
}

/** Estado actual del equipamiento del jugador */
export interface EquippedGear {
    mainHand: EquipmentItem | null;
    offHand: EquipmentItem | null;
    armor: EquipmentItem | null;
    accessory1: EquipmentItem | null;
    accessory2: EquipmentItem | null;
}
