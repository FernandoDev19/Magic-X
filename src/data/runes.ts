import type { MagicElement } from "../types/magic-element.type";
import type { Rune, RuneCategory, FormId, SubjectId, VectorId } from "../types/rune.type";

// ─── RUNAS ────────────────────────────────────────────────
export const SUBJECT_RUNES: Rune<SubjectId>[] = [
    {
        id: "ego", category: "subject", name: "Ego", glyph: "ᛟ", meaning: "Yo",
        description: "El hechizo se centra en Kael'Rin: curaciones, escudos y potenciadores.",
        unlockLevel: 1,
    },
    {
        id: "ille", category: "subject", name: "Ille", glyph: "ᚨ", meaning: "Él / Ese",
        description: "Se dirige a un único objetivo seleccionado.",
        unlockLevel: 1,
    },
    {
        id: "illi", category: "subject", name: "Illi", glyph: "ᚢ", meaning: "Ellos",
        description: "Se manifiesta en área y golpea a todos los enemigos (menos daño por objetivo, más maná).",
        unlockLevel: 3, unlockable: true,
    },
];

export const VECTOR_RUNES: Rune<VectorId>[] = [
    {
        id: "pro", category: "vector", name: "Pro", glyph: "→", meaning: "Adelante",
        description: "Proyecta la energía hacia la línea enemiga. Directo y enfocado (+10% daño).",
        unlockLevel: 1,
    },
    {
        id: "retro", category: "vector", name: "Retro", glyph: "←", meaning: "Atrás / Retorno",
        description: "Atrae la energía de vuelta: −15% daño, pero recuperas maná del daño causado.",
        unlockLevel: 2, unlockable: true,
    },
    {
        id: "surfum", category: "vector", name: "Surfum", glyph: "↑", meaning: "Arriba / Cielo",
        description: "Invoca desde el cielo: +25% daño en área (+10% en objetivo único), cuesta más maná.",
        unlockLevel: 4, unlockable: true,
    },
    {
        id: "terra", category: "vector", name: "Terra", glyph: "↓", meaning: "Abajo / Tierra",
        description: "Ancla la energía al suelo: −30% daño, estados más potentes y largos, y el hechizo es mucho más estable. En Ego otorga guardia.",
        unlockLevel: 5, unlockable: true,
    },
];

export const FORM_RUNES: Rune<FormId>[] = [
    {
        id: "acies", category: "form", name: "Acies", glyph: "⟁", meaning: "Filo / Corte",
        description: "Magia en un punto ultra afilado: +15% daño, crítico (25%) y perfora resistencia mágica. Estados más débiles.",
        unlockLevel: 1,
    },
    {
        id: "lene", category: "form", name: "Lene", glyph: "◌", meaning: "Borde suave / Dispersión",
        description: "Suaviza el impacto y expande la energía: −20% daño, estados más potentes y +1 turno, más estable.",
        unlockLevel: 2, unlockable: true,
    },
];

export const ALL_RUNES: Rune[] = [...SUBJECT_RUNES, ...VECTOR_RUNES, ...FORM_RUNES];

export function getRune(id: string): Rune | undefined {
    return ALL_RUNES.find((r) => r.id === id);
}

export function runesOf(category: RuneCategory): Rune[] {
    return ALL_RUNES.filter((r) => r.category === category);
}

/** Una runa se desbloquea por nivel del jugador o por un flag (`rune_<id>`) dado por historia / tienda / exploración */
export function isRuneUnlocked(rune: Rune, playerLevel: number, flags: Record<string, boolean | number> = {}): boolean {
    if (playerLevel >= rune.unlockLevel) return true;
    return !!rune.unlockable && !!flags[`rune_${rune.id}`];
}

/**
 * Cuántos elementos se pueden combinar a la vez.
 * Por ahora 3 para todos; aquí se puede escalar a 5 por nivel / historia.
 */
export function maxElementsFor(_playerLevel: number): number {
    return 3;
}

// ─── ELEMENTOS EN EL OCTAGRAMA ────────────────────────────
/**
 * Posición de cada elemento sobre la imagen del círculo (en % del ancho/alto).
 * La imagen es /art/ui/Pergamino Circulo magico.png (640×669).
 * Cambia el valor de `element` para reordenar qué elemento ocupa cada sigilo.
 * Los opuestos (que chocan entre sí) están en posiciones enfrentadas.
 */
export interface ElementNode {
    element: MagicElement;
    /** Centro del triángulo en la imagen, en % */
    x: number;
    y: number;
}

export const OCTAGRAM_IMAGE = "/art/ui/Pergamino Circulo magico.png";
export const OCTAGRAM_ASPECT = 640 / 669;

export const ELEMENT_NODES: ElementNode[] = [
    { element: "fire",    x: 50, y: 22 }, // arriba (A)
    { element: "electric", x: 69, y: 35 }, // arriba-derecha
    { element: "darkness",     x: 78, y: 51 }, // derecha
    { element: "air",    x: 69, y: 65 }, // abajo-derecha
    { element: "water", x: 50, y: 80 }, // abajo
    { element: "earth",    x: 30, y: 65 }, // abajo-izquierda
    { element: "light",    x: 20, y: 50 }, // izquierda
    { element: "vital",      x: 30, y: 34 }, // arriba-izquierda
];

/** Pares de elementos opuestos: combinarlos es potente pero inestable */
export const OPPOSITES: [MagicElement, MagicElement][] = [
    ["light", "darkness"],
    ["fire", "water"],
    ["air", "earth"],
    ["electric", "vital"],
];

export function areOpposed(a: MagicElement, b: MagicElement): boolean {
    return OPPOSITES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}
