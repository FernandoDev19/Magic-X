export type MagicElement =
    | "fire" | "earth" | "water" | "air"
    | "light" | "darkness" | "electric" | "vital";

export type ElementLevels = Record<MagicElement, number>;
export type ElementAffinity = Record<MagicElement, number>;
