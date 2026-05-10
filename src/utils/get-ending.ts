import type { Stats } from "../types/player.type";

export function getEnding(stats: Stats, xp: number): string {
    if (stats.corruption >= 70) return "El dios oscuro resurge. El mundo tiembla ante tu nombre.";
    if (xp >= 300) return "Tu poder ha crecido más allá de lo esperado. Quizás la venganza está cerca.";
    if (stats.magicResistance >= 50) return "Tu resistencia al caos es absoluta. Naciste para sobrevivir.";
    return "Ni dios ni humano. Algo nuevo. Algo sin nombre todavía.";
}