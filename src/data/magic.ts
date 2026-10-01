import type { MagicElement } from "../types/magic-element.type";
import type { ManaType } from "../types/spell.type";

export interface MagicSchool {
    element: MagicElement;
    name: string;
    icon: string;
    manaType: ManaType;
    maxLevel: number;
    description: string;
    color: string;
}

export const MAGIC_SCHOOLS: MagicSchool[] = [
    {
        element: "fire",
        name: "Fuego",
        icon: "🔥",
        manaType: "mana",
        maxLevel: 100,
        description:
            "Magia destructiva de calor y combustión. Alta probabilidad de ignición.",
        color: "#E24B4A",
    },
    {
        element: "earth",
        name: "Tierra",
        icon: "🪨",
        manaType: "mana",
        maxLevel: 100,
        description: "Magia de defensa y control. Muros, púas y meteoritos.",
        color: "#BA7517",
    },
    {
        element: "water",
        name: "Agua",
        icon: "💧",
        manaType: "mana",
        maxLevel: 100,
        description: "Magia de control y ralentización. Congelación y lluvia.",
        color: "#378ADD",
    },
    {
        element: "air",
        name: "Aire",
        icon: "🌪",
        manaType: "mana",
        maxLevel: 100,
        description:
            "Magia de movilidad e invisibilidad. Tormentas y cuchillas.",
        color: "#5DCAA5",
    },
    {
        element: "light",
        name: "Luz",
        icon: "✨",
        manaType: "celestial",
        maxLevel: 100,
        description:
            "Magia sagrada de sanación y purificación. Requiere Maná Celestial.",
        color: "#FAC775",
    },
    {
        element: "darkness",
        name: "Oscuridad",
        icon: "🌑",
        manaType: "infernal",
        maxLevel: 100,
        description:
            "Magia de maldiciones, corrupción y control mental. Requiere Maná Infernal.",
        color: "#7F77DD",
    },
    {
        element: "electric",
        name: "Electricidad",
        icon: "⚡",
        manaType: "mana",
        maxLevel: 100,
        description:
            "Magia de rayos y parálisis. Alta velocidad de proyectiles.",
        color: "#EF9F27",
    },
    {
        element: "vital",
        name: "E. Vital",
        icon: "💛",
        manaType: "mana",
        maxLevel: 100,
        description:
            "Energía de la vida misma. Mejoras físicas, telequinesis, invocación.",
        color: "#1D9E75",
    },
];

export const MANA_TYPES = [
    {
        type: "mana" as ManaType,
        name: "Maná",
        description: "Para todos los elementos excepto Luz y Oscuridad.",
        color: "#378ADD",
        elements: ["fire", "earth", "water", "air", "electric", "vital"],
    },
    {
        type: "celestial" as ManaType,
        name: "Maná Celestial",
        description: "Exclusivo para manipular la Luz.",
        color: "#FAC775",
        elements: ["light"],
    },
    {
        type: "infernal" as ManaType,
        name: "Maná Infernal",
        description:
            "Exclusivo para manipular la Oscuridad. Se obtiene corrompiendo el alma.",
        color: "#7F77DD",
        elements: ["darkness"],
    },
];

export function getSchool(element: MagicElement): MagicSchool {
    return MAGIC_SCHOOLS.find((s) => s.element === element)!;
}
