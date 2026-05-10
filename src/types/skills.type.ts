import type { StatusEffect } from "./status-effect.type";

export interface Skill {
    id: string;
    name: string;
    description: string;
    level: number;
    manaCost: number;
    manaType: string;
    targetType: "self" | "enemy" | "area";
    areaEffect?: boolean;
    damage?: number;
    effects?: StatusEffect[];
    heal?: number;
}
