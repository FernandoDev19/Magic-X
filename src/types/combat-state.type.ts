import type { Enemy } from "./enemy.type";
import type { MagicElement } from "./magic-element.type";

export type ActorRef =
    | { kind: "player" }
    | { kind: "companion"; id: string }
    | { kind: "enemy"; idx: number };

export interface CombatState {
    active: boolean;
    enemies: Enemy[];
    selectedEnemyIndex: number;
    turn: "player" | "enemy";
    round: number;
    log: string[];
    comboSlot: MagicElement[];
    /** Orden de actuación de la ronda actual */
    order: ActorRef[];
    /** Índice en `order` del actor que actúa a continuación */
    turnIdx: number;
}