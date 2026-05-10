import type { Enemy } from "./enemy.type";
import type { MagicElement } from "./magic-element.type";

export interface CombatState {
    active: boolean;
    enemies: Enemy[];               // grupo de enemigos (1-4)
    selectedEnemyIndex: number;     // índice del enemigo objetivo para hechizos de objetivo único
    turn: "player" | "enemy";
    round: number;
    log: string[];
    comboSlot: MagicElement[];
}