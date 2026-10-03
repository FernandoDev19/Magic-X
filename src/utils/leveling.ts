import type { GameState } from "../types/game-state";
import type { Quest } from "../types/quest.type";
import { getSkillById } from "../data/skills";
import { getSpellById } from "../data/spells";
import { mergeLootIntoInventory } from "./loot";

type Player = GameState["player"];

export const MAX_LEVEL = 20;

/** XP para pasar de `level` a `level+1` (1→2: 50, 2→3: 70, 3→4: 90...) */
export function xpToNext(level: number): number {
    return 30 + level * 20;
}

/** XP total acumulada necesaria para ALCANZAR `level` */
export function totalXpForLevel(level: number): number {
    let t = 0;
    for (let l = 1; l < level; l++) t += xpToNext(l);
    return t;
}

export function levelFromXp(xp: number): number {
    let level = 1;
    while (level < MAX_LEVEL && xp >= totalXpForLevel(level + 1)) level++;
    return level;
}

/** Progreso dentro del nivel actual, para barras de UI */
export function levelProgress(level: number, xp: number) {
    const into = xp - totalXpForLevel(level);
    const needed = level >= MAX_LEVEL ? 1 : xpToNext(level);
    return { into: Math.max(0, into), needed, pct: Math.min(100, (into / needed) * 100) };
}

/** Qué se desbloquea en cada nivel (ajústalo a tu gusto) */
const LEVEL_REWARDS: Record<number, { skillIds?: string[]; spellIds?: string[] }> = {
    2: { skillIds: ["heavy_strike"], spellIds: ["lightning_1"] },
    3: { skillIds: ["defensive_stance"], spellIds: ["soul_trap_1"] },
    4: { skillIds: ["blood_slash"], spellIds: ["whirlwind_1"] },
    5: { skillIds: ["warcry"], spellIds: ["ice_arrow_1"] },
    6: { skillIds: ["quick_evasion"], spellIds: ["heart_curse_1"] },
};

export interface LevelUpInfo {
    level: number;
    gains: { label: string; value: number }[];
    newSkills: string[];
    newSpells: string[];
}

export function gainXp(player: Player, amount: number): { player: Player; levelUps: LevelUpInfo[] } {
    let p: Player = { ...player, xp: player.xp + amount, level: player.level ?? levelFromXp(player.xp) };
    const levelUps: LevelUpInfo[] = [];

    while (p.level < MAX_LEVEL && p.xp >= totalXpForLevel(p.level + 1)) {
        const level = p.level + 1;
        const speedGain = level % 2 === 0 ? 1 : 0;
        const hpGain = 12;
        const manaGain = 8;
        const celestialGain = 4;
        const infernalGain = 4;

        const stats = {
            ...p.stats,
            maxHp: p.stats.maxHp + hpGain,
            // cura 25% de la vida máxima al subir: sensación de recompensa
            hp: Math.min(p.stats.maxHp + hpGain, p.stats.hp + hpGain + Math.round(p.stats.maxHp * 0.25)),
            physical_strength: p.stats.physical_strength + 1,
            magical_strength: p.stats.magical_strength + 2,
            resistance: p.stats.resistance + 1,
            magicResistance: p.stats.magicResistance + 1,
            speed: p.stats.speed + speedGain,
        };
        const mana = {
            ...p.mana,
            maxMana: p.mana.maxMana + manaGain,
            mana: p.mana.mana + manaGain,
            maxCelestial: (p.mana.maxCelestial ?? 40) + celestialGain,
            celestial: Math.min((p.mana.maxCelestial ?? 40) + celestialGain, (p.mana.celestial ?? 0) + celestialGain),
            maxInfernal: (p.mana.maxInfernal ?? 40) + infernalGain,
            infernal: Math.min((p.mana.maxInfernal ?? 40) + infernalGain, (p.mana.infernal ?? 0) + infernalGain),
        };

        const reward = LEVEL_REWARDS[level];
        const newSkills = (reward?.skillIds ?? [])
            .filter((id) => !p.skills.some((s) => s.id === id))
            .map((id) => getSkillById(id)!)
            .filter(Boolean);
        const newSpells = (reward?.spellIds ?? [])
            .filter((id) => !p.spells.some((s) => s.id === id))
            .map((id) => getSpellById(id)!)
            .filter(Boolean);

        p = {
            ...p,
            level,
            stats,
            mana,
            skills: [...p.skills, ...newSkills],
            spells: [...p.spells, ...newSpells],
        };

        const gains = [
            { label: "PV máx", value: hpGain },
            { label: "Maná máx", value: manaGain },
            { label: "Celestial máx", value: celestialGain },
            { label: "Infernal máx", value: infernalGain },
            { label: "Fuerza física", value: 1 },
            { label: "Fuerza mágica", value: 2 },
            { label: "Resistencia", value: 1 },
            { label: "Res. mágica", value: 1 },
        ];
        if (speedGain) gains.push({ label: "Velocidad", value: speedGain });

        levelUps.push({
            level,
            gains,
            newSkills: newSkills.map((s) => s.name),
            newSpells: newSpells.map((s) => s.name),
        });
    }

    return { player: p, levelUps };
}

/** Aplica la recompensa de una misión completada */
export function applyQuestReward(player: Player, quest: Quest) {
    const r = quest.reward!;
    const lines: string[] = [];
    let p = player;

    if (r.gold) {
        p = { ...p, items: mergeLootIntoInventory(p.items, { items: [], gold: r.gold, xp: 0 }) };
        lines.push(`💰 +${r.gold} oro`);
    }
    if (r.spellId && !p.spells.some((s) => s.id === r.spellId)) {
        const spell = getSpellById(r.spellId);
        if (spell) {
            p = { ...p, spells: [...p.spells, spell] };
            lines.push(`📖 Aprendes ${spell.name}`);
        }
    }
    let levelUps: LevelUpInfo[] = [];
    if (r.xp) {
        const res = gainXp(p, r.xp);
        p = res.player;
        levelUps = res.levelUps;
        lines.push(`⭐ +${r.xp} XP`);
    }
    return { player: p, levelUps, lines };
}