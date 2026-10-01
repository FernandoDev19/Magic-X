import type { Stats } from "../types/player.type";
import type { Spell } from "../types/spell.type";

/**
 * Effects of corruption on the player.
 * Called every combat round or on state change.
 */
export interface CorruptionEffect {
    statModifier: Partial<Stats>;
    unlockedSpellIds: string[];
    statusMessage: string | null;
    darkVoice: string | null; // narrative flavor text shown at high corruption
}

export function getCorruptionEffects(corruption: number): CorruptionEffect {
    if (corruption >= 90) {
        return {
            statModifier: {
                magical_strength: 25,
                resistance: -10,
                magicResistance: -5,
            },
            unlockedSpellIds: ["slave_curse", "black_flames", "heart_curse_1"],
            statusMessage: "CORROMPIDO — Poder oscuro desbordante. Estás al borde del abismo.",
            darkVoice: "El poder fluye sin control... ¿Esto es lo que querías?",
        };
    }
    if (corruption >= 70) {
        return {
            statModifier: {
                magical_strength: 15,
                resistance: -5,
            },
            unlockedSpellIds: ["heart_curse_1", "stat_debuff_1"],
            statusMessage: "MUY CORRUPTO — El poder oscuro amplifica tu magia.",
            darkVoice: "Las sombras te susurran secretos prohibidos...",
        };
    }
    if (corruption >= 50) {
        return {
            statModifier: {
                magical_strength: 8,
            },
            unlockedSpellIds: ["shadow_manipulation"],
            statusMessage: "CORRUPTO — Sientes el peso de la oscuridad.",
            darkVoice: null,
        };
    }
    if (corruption <= 10) {
        return {
            statModifier: {
                magicResistance: 10,
                sanity: 5,
            },
            unlockedSpellIds: ["heal_1", "purification_1", "light_armor_1"],
            statusMessage: "PURO — La luz te protege.",
            darkVoice: null,
        };
    }
    return {
        statModifier: {},
        unlockedSpellIds: [],
        statusMessage: null,
        darkVoice: null,
    };
}

/**
 * Effects of low sanity on the player.
 */
export interface SanityEffect {
    missChance: number;        // 0-1, chance to act erratically
    statModifier: Partial<Stats>;
    message: string | null;
}

export function getSanityEffects(sanity: number): SanityEffect {
    if (sanity <= 10) {
        return {
            missChance: 0.4,
            statModifier: { speed: -10, magicResistance: -10 },
            message: "LOCURA — Tu mente se quiebra. Pierdes el control.",
        };
    }
    if (sanity <= 30) {
        return {
            missChance: 0.2,
            statModifier: { speed: -5 },
            message: "INESTABLE — Tu concentración falla.",
        };
    }
    if (sanity <= 50) {
        return {
            missChance: 0.1,
            statModifier: {},
            message: "PERTURBADO — Algo no está bien en tu mente.",
        };
    }
    return {
        missChance: 0,
        statModifier: {},
        message: null,
    };
}

/**
 * Returns spells unlocked by corruption level that the player doesn't already have.
 */
export function getCorruptionBonusSpells(
    corruption: number,
    knownSpells: Spell[],
    allSpells: Spell[],
): Spell[] {
    const { unlockedSpellIds } = getCorruptionEffects(corruption);
    const knownIds = new Set(knownSpells.map((s) => s.id));
    return allSpells.filter(
        (s) => unlockedSpellIds.includes(s.id) && !knownIds.has(s.id),
    );
}

/**
 * Applies corruption/sanity stat modifiers on top of existing stats.
 * These are temporary and should be computed fresh each time, not stored.
 */
export function applyMentalEffects(
    stats: Stats,
): Stats {
    const corrEff = getCorruptionEffects(stats.corruption);
    const sanEff = getSanityEffects(stats.sanity);

    return {
        ...stats,
        magical_strength: Math.max(
            0,
            stats.magical_strength +
                (corrEff.statModifier.magical_strength ?? 0) +
                (sanEff.statModifier.magical_strength ?? 0),
        ),
        resistance: Math.max(
            0,
            stats.resistance +
                (corrEff.statModifier.resistance ?? 0) +
                (sanEff.statModifier.resistance ?? 0),
        ),
        magicResistance: Math.max(
            0,
            stats.magicResistance +
                (corrEff.statModifier.magicResistance ?? 0) +
                (sanEff.statModifier.magicResistance ?? 0),
        ),
        speed: Math.max(
            0,
            stats.speed +
                (corrEff.statModifier.speed ?? 0) +
                (sanEff.statModifier.speed ?? 0),
        ),
    };
}