import type { Enemy } from "../types/enemy.type";
import type {
    EquipmentBonuses,
    EquipmentItem,
    EquipmentSlot,
    EquippedGear,
} from "../types/equipment.type";
import type { Stats, Mana } from "../types/player.type";
import type { StatusEffect } from "../types/status-effect.type";

/** Devuelve un EquippedGear vacío */
export function emptyGear(): EquippedGear {
    return {
        mainHand: null,
        offHand: null,
        armor: null,
        accessory1: null,
        accessory2: null,
    };
}

/**
 * Intenta equipar un item en el slot indicado.
 * Devuelve el nuevo gear y el item desequipado (si había uno), o un error.
 */
export function equipItem(
    gear: EquippedGear,
    item: EquipmentItem,
    slot: EquipmentSlot,
): { newGear: EquippedGear; unequipped: EquipmentItem[]; error?: string } {
    // Validar que el item puede ir en ese slot
    if (!item.validSlots.includes(slot)) {
        return {
            newGear: gear,
            unequipped: [],
            error: `${item.name} no se puede equipar en ese slot.`,
        };
    }

    const unequipped: EquipmentItem[] = [];
    const newGear = { ...gear };

    // Si el arma es de 2 manos y se equipa en mainHand, liberar offHand
    if (slot === "mainHand" && item.grip === "two-handed") {
        if (newGear.offHand) {
            unequipped.push(newGear.offHand);
            newGear.offHand = null;
        }
    }

    // Si se equipa algo en offHand pero mainHand tiene arma de 2 manos, error
    if (slot === "offHand" && newGear.mainHand?.grip === "two-handed") {
        return {
            newGear: gear,
            unequipped: [],
            error: `No puedes usar la mano secundaria: ${newGear.mainHand.name} requiere ambas manos.`,
        };
    }

    // Desequipar lo que ya había en el slot
    if (newGear[slot]) {
        unequipped.push(newGear[slot]!);
    }

    newGear[slot] = item;
    return { newGear, unequipped };
}

/** Desequipa un slot y devuelve el item */
export function unequipSlot(
    gear: EquippedGear,
    slot: EquipmentSlot,
): { newGear: EquippedGear; unequipped: EquipmentItem | null } {
    const newGear = { ...gear };
    const item = newGear[slot];
    newGear[slot] = null;
    return { newGear, unequipped: item };
}

/** Suma todas las bonificaciones del equipo actual */
export function getTotalBonuses(gear: EquippedGear): EquipmentBonuses {
    const slots: EquipmentSlot[] = [
        "mainHand",
        "offHand",
        "armor",
        "accessory1",
        "accessory2",
    ];
    const totals: EquipmentBonuses = {};

    for (const slot of slots) {
        const item = gear[slot];
        if (!item) continue;
        for (const [key, value] of Object.entries(item.bonuses)) {
            const k = key as keyof EquipmentBonuses;
            totals[k] = (totals[k] ?? 0) + (value ?? 0);
        }
    }
    return totals;
}

/** Calcula las stats efectivas del jugador con equipo */
export function getEffectiveStats(
    baseStats: Stats,
    gear: EquippedGear,
    effects: StatusEffect[],
): Stats {
    const bonuses = getTotalBonuses(gear);

    let stats: Stats = {
        ...baseStats,
        hp: baseStats.hp,
        maxHp: baseStats.maxHp + (bonuses.maxHp ?? 0),
        physical_strength:
            baseStats.physical_strength + (bonuses.physical_strength ?? 0),
        magical_strength:
            baseStats.magical_strength + (bonuses.magical_strength ?? 0),
        speed: baseStats.speed + (bonuses.speed ?? 0),
        resistance: baseStats.resistance + (bonuses.resistance ?? 0),
        magicResistance:
            baseStats.magicResistance + (bonuses.magicResistance ?? 0),
        corruption: baseStats.corruption,
        sanity: baseStats.sanity,
    };

    for (const effect of effects) {
        switch (effect.type) {
            case "strengthened":
                stats.physical_strength += effect.value ?? 0;
                stats.speed += effect.value ?? 0;
                break;

            case "weakened":
                stats.physical_strength -= effect.value ?? 0;
                stats.speed -= effect.value ?? 0;
                break;

            case "slowed":
                stats.speed -= Math.floor(
                    stats.speed * ((effect.value ?? 50) / 100),
                );
                break;
        }
    }

    return stats;
}

export function getEnemyEffectiveStats(enemy: Enemy): Enemy {
    let stats = { ...enemy };

    for (const effect of enemy.statusEffects) {
        switch (effect.type) {
            case "strengthened":
                stats.physical_strength += effect.value ?? 0;
                stats.speed += effect.value ?? 0;
                break;

            case "weakened":
                stats.physical_strength -= effect.value ?? 0;
                stats.speed -= effect.value ?? 0;
                break;

            case "slowed":
                stats.speed -= Math.floor(
                    stats.speed * ((effect.value ?? 50) / 100),
                );
                break;
        }
    }

    return stats;
}

/** Calcula la mana efectiva con bonuses de equipo */
export function getEffectiveMana(baseMana: Mana, gear: EquippedGear): Mana {
    const bonuses = getTotalBonuses(gear);
    return {
        ...baseMana,
        maxMana: baseMana.maxMana + (bonuses.maxMana ?? 0),
        maxCelestial: baseMana.maxCelestial + (bonuses.maxCelestial ?? 0),
        maxInfernal: baseMana.maxInfernal + (bonuses.maxInfernal ?? 0),
    };
}

/** Verifica si el jugador tiene un arma de 2 manos equipada */
export function hasTwoHandedWeapon(gear: EquippedGear): boolean {
    return gear.mainHand?.grip === "two-handed";
}

/** Obtiene el nombre del slot para la UI */
export function getSlotLabel(slot: EquipmentSlot): string {
    const labels: Record<EquipmentSlot, string> = {
        mainHand: "Mano principal",
        offHand: "Mano secundaria",
        armor: "Armadura",
        accessory1: "Accesorio 1",
        accessory2: "Accesorio 2",
    };
    return labels[slot];
}

/** Obtiene el icono del slot para la UI */
export function getSlotIcon(slot: EquipmentSlot): string {
    const icons: Record<EquipmentSlot, string> = {
        mainHand: "⚔️",
        offHand: "🛡️",
        armor: "🛡️",
        accessory1: "💍",
        accessory2: "💍",
    };
    return icons[slot];
}
