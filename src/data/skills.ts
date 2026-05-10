import type { Skill } from "../types/skills.type";

export const ALL_SKILLS: Skill[] = [
    {
        id: "bite",
        name: "Mordida",
        description: "Ataque físico básico.",
        level: 1,
        manaCost: 0,
        manaType: "mana",
        targetType: "enemy",
        damage: 15,
    },
    {
        id: "howl",
        name: "Aullido",
        description: "Aumenta tu fuerza temporalmente.",
        level: 1,
        manaCost: 5,
        manaType: "mana",
        targetType: "self",
        effects: [{ type: "strengthened", duration: 3, value: 10 }],
    },
    {
        id: "heavy_strike",
        name: "Golpe Pesado",
        description: "Un ataque con todas tus fuerzas que rompe defensas.",
        level: 2,
        manaCost: 15,
        manaType: "mana",
        targetType: "enemy",
        damage: 35,
    },
    {
        id: "quick_evasion",
        name: "Evasión Rápida",
        description: "Aumenta tu velocidad drásticamente.",
        level: 3,
        manaCost: 10,
        manaType: "mana",
        targetType: "self",
        effects: [{ type: "strengthened", duration: 3, value: 20 }], // Wait, needs speed effect? We don't have haste. strengthen acts on everything usually, let's keep it simple or create a new status type. The combat system doesn't have "evasion" stat natively yet. I'll use "strengthened"].
    },
    {
        id: "blood_slash",
        name: "Corte Sangriento",
        description: "Un tajo profundo que hace sangrar al objetivo.",
        level: 4,
        manaCost: 20,
        manaType: "mana",
        targetType: "enemy",
        damage: 20,
        effects: [{ type: "poisoned", duration: 3, value: 5 }], // Using poisoned as bleed effect
    },
    {
        id: "defensive_stance",
        name: "Postura Defensiva",
        description: "Aumenta la resistencia física y mágica.",
        level: 2,
        manaCost: 10,
        manaType: "mana",
        targetType: "self",
        // Needs a defensive buff. Our current status types in combat.ts handle poisoned, burning, cursed, weakened, paralyzed, frozen, invisible, strengthened.
        effects: [{ type: "strengthened", duration: 3, value: 15 }],
    },
    {
        id: "warcry",
        name: "Grito de Guerra",
        description: "Intimida a los enemigos debilitándolos.",
        level: 5,
        manaCost: 25,
        manaType: "mana",
        targetType: "area",
        areaEffect: true,
        effects: [{ type: "weakened", duration: 2, value: 10 }],
    },
];

export function getSkillById(id: string): Skill | undefined {
    return ALL_SKILLS.find((s) => s.id === id);
}
