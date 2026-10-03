import type { MagicElement } from "../types/magic-element.type";
import type { StatusEffect } from "../types/status-effect.type";

/** Datos base por elemento para el motor de síntesis (spell-forge) */
export interface ElementForgeData {
    noun: string;
    /** Daño base a nivel de elemento 0 (se escala con el nivel del elemento) */
    damage: number;
    /** Coste base de maná (se multiplica por la afinidad) */
    cost: number;
    /** Curación base (solo cuenta en Ego) */
    heal: number;
    /** Fracción de resistencia mágica que ignora este elemento */
    pierce: number;
    /** Estado que aplica a enemigos */
    offense?: StatusEffect;
    /** Estado que se aplica a sí mismo con Ego */
    self?: StatusEffect;
}

export const ELEMENT_FORGE: Record<MagicElement, ElementForgeData> = {
    fire: {
        noun: "Fuego", damage: 16, cost: 12, heal: 0, pierce: 0,
        offense: { type: "ignition", duration: 2, value: 5 },
        self: { type: "strengthened", duration: 3, value: 8 },
    },
    water: {
        noun: "Agua", damage: 10, cost: 7, heal: 8, pierce: 0,
        offense: { type: "slowed", duration: 2, value: 40 },
        self: { type: "guarding", duration: 1 },
    },
    earth: {
        noun: "Tierra", damage: 14, cost: 10, heal: 0, pierce: 0,
        offense: { type: "weakened", duration: 2, value: 8 },
        self: { type: "guarding", duration: 1 },
    },
    air: {
        noun: "Aire", damage: 11, cost: 8, heal: 0, pierce: 0.1,
        offense: { type: "slowed", duration: 1, value: 25 },
        self: { type: "invisible", duration: 2 },
    },
    light: {
        noun: "Luz", damage: 14, cost: 12, heal: 22, pierce: 0.2,
    },
    darkness: {
        noun: "Sombra", damage: 13, cost: 11, heal: 0, pierce: 0.1,
        offense: { type: "cursed", duration: 3, value: 4 },
        self: { type: "strengthened", duration: 3, value: 12 },
    },
    electric: {
        noun: "Rayo", damage: 15, cost: 11, heal: 0, pierce: 0,
        offense: { type: "paralyzed", duration: 1 },
        self: { type: "velocitized", duration: 3, value: 10 },
    },
    vital: {
        noun: "Vida", damage: 7, cost: 8, heal: 16, pierce: 0,
        offense: { type: "slowed", duration: 2, value: 30 },
        self: { type: "strengthened", duration: 3, value: 8 },
    },
};

/** Sinergias / choques entre pares de elementos. Clave: ids ordenados alfabéticamente unidos con "+" */
export interface PairData {
    name: string;
    /** Multiplicador de daño */
    dmg?: number;
    /** Multiplicador de curación (Ego) */
    heal?: number;
    pierce?: number;
    crit?: number;
    effect?: StatusEffect;
    /** Variación de corrupción al lanzarlo */
    corruption?: number;
}

export const PAIR_TABLE: Record<string, PairData> = {
    // ── Opuestos: muy potentes, inestables ──
    "fire+water": { name: "Vapor", dmg: 1.3, effect: { type: "weakened", duration: 2, value: 10 } },
    "darkness+light": { name: "Eclipse", dmg: 1.4, effect: { type: "cursed", duration: 2, value: 4 } },
    "air+earth": { name: "Polvareda", dmg: 1.25, effect: { type: "weakened", duration: 2, value: 12 } },
    "electric+vital": { name: "Descarga vital", dmg: 1.25, heal: 1.3 },
    // ── Afines ──
    "air+fire": { name: "Tormenta ígnea", dmg: 1.2 },
    "electric+water": { name: "Tormenta eléctrica", dmg: 1.15, effect: { type: "paralyzed", duration: 1 } },
    "earth+fire": { name: "Lava", dmg: 1.2, effect: { type: "ignition", duration: 3, value: 7 } },
    "darkness+fire": { name: "Llamas negras", dmg: 1.2, effect: { type: "burning", duration: 4, value: 8 }, corruption: 2 },
    "darkness+electric": { name: "Rayo oscuro", dmg: 1.15, effect: { type: "cursed", duration: 3, value: 5 } },
    "light+water": { name: "Lluvia sagrada", dmg: 1.05, heal: 1.35 },
    "light+vital": { name: "Bendición", dmg: 1.05, heal: 1.4, effect: { type: "strengthened", duration: 3, value: 8 } },
    "fire+light": { name: "Llama celestial", dmg: 1.25, pierce: 0.1 },
    "earth+water": { name: "Cieno", dmg: 1.05, effect: { type: "slowed", duration: 3, value: 50 } },
    "air+electric": { name: "Relámpago", dmg: 1.2, crit: 0.1 },
    "darkness+water": { name: "Ácido", dmg: 1.15, effect: { type: "poisoned", duration: 3, value: 6 } },
    "earth+vital": { name: "Raíces", dmg: 1.0, heal: 1.2, effect: { type: "slowed", duration: 2, value: 40 } },
    "air+vital": { name: "Vendaval vital", dmg: 1.0, heal: 1.1, effect: { type: "velocitized", duration: 3, value: 10 } },
    "earth+light": { name: "Cristal", dmg: 1.15, pierce: 0.1 },
    "darkness+vital": { name: "Marchitar", dmg: 1.1, effect: { type: "weakened", duration: 3, value: 12 } },
    "air+water": { name: "Niebla", dmg: 1.05, effect: { type: "slowed", duration: 2, value: 35 } },
    "air+darkness": { name: "Niebla negra", dmg: 1.1, effect: { type: "weakened", duration: 2, value: 10 } },
    "earth+electric": { name: "Magnetismo", dmg: 1.15, crit: 0.05 },
    "darkness+earth": { name: "Sepulcro", dmg: 1.15, effect: { type: "slowed", duration: 2, value: 40 } },
    "air+light": { name: "Aurora", dmg: 1.1, heal: 1.15, pierce: 0.1 },
    "electric+light": { name: "Rayo sagrado", dmg: 1.2, pierce: 0.15 },
    "electric+fire": { name: "Plasma", dmg: 1.25, crit: 0.05 },
    "vital+water": { name: "Marea vital", dmg: 1.0, heal: 1.25 },
    "fire+vital": { name: "Furia vital", dmg: 1.1, effect: { type: "strengthened", duration: 3, value: 10 } },
};

export function pairKey(a: MagicElement, b: MagicElement): string {
    return [a, b].sort().join("+");
}

export function getPair(a: MagicElement, b: MagicElement): PairData | undefined {
    return PAIR_TABLE[pairKey(a, b)];
}
