import type { MagicElement } from "./magic-element.type";

export type RuneCategory = "subject" | "vector" | "form";

/** Sujeto: ¿quién recibe el hechizo? */
export type SubjectId = "ego" | "ille" | "illi";
/** Vector: ¿hacia dónde / con qué comportamiento? */
export type VectorId = "pro" | "retro" | "surfum" | "terra";
/** Forma: ¿cómo se manifiesta físicamente? */
export type FormId = "acies" | "lene";

export type RuneId = SubjectId | VectorId | FormId;

export interface Rune<T extends RuneId = RuneId> {
    id: T;
    category: RuneCategory;
    name: string;
    /** Emoji/glifo provisional hasta tener arte propio */
    glyph: string;
    /** Significado en latín/español, para el tooltip */
    meaning: string;
    description: string;
    /** Nivel del jugador que la desbloquea */
    unlockLevel: number;
    /** También se desbloquea si flags[`rune_${id}`] es true (historia / tienda) */
    unlockable?: boolean;
}

/** Lo que el jugador va armando en el círculo */
export interface RuneSelection {
    elements: MagicElement[];
    subject: SubjectId | null;
    vector: VectorId | null;
    form: FormId | null;
}

export type CompleteSelection = {
    elements: MagicElement[];
    subject: SubjectId;
    vector: VectorId;
    form: FormId;
};

/** Receta guardada en el grimorio: un atajo a una combinación */
export interface SpellRecipe {
    id: string;
    elements: MagicElement[];
    subject: SubjectId;
    vector: VectorId;
    form: FormId;
    source?: "crafted" | "found" | "bought" | "story";
}
