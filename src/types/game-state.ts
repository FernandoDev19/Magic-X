import type { CombatState } from "./combat-state.type";
import type { EquippedGear } from "./equipment.type";
import type { Item } from "./item.type";
import type { ElementAffinity, ElementLevels } from "./magic-element.type";
import type { Mana, Role, Stats } from "./player.type";
import type { Skill } from "./skills.type";
import type { Spell } from "./spell.type";
import type { StatusEffect } from "./status-effect.type";

export interface NarrativeEffect {
    corruption?: number;
    hpChange?: number;
    manaChange?: number;
    celestial?: number;
    infernal?: number;
    physical_strength?: number;
    magical_strength?: number;
    speed?: number;
    resistance?: number;
    magicResistance?: number;
    sanity?: number;
    stability?: number;
    gainSpellId?: string;
    gainItemId?: string;
    gainItemId2?: string;
}

export interface StoryOption {
    text: string;
    effect?: NarrativeEffect;
    consequence?: string;
    nextNodeId?: string;
    triggerEnemyId?: string;
    returnToHub?: boolean;
}

export interface StoryNode {
    id: string;
    speaker?: string; // Si es null, es el narrador
    text: string;
    options?: StoryOption[];
    nextNodeId?: string;
    triggerEnemyId?: string;
    returnToHub?: boolean;
}

export interface Chapter {
    id: string;
    title: string;
    startNodeId: string;
    nodes: Record<string, StoryNode>;
}

export interface GameState2 {
    stats: Stats;
    mana: Mana;
    elementLevels: ElementLevels;
    elementAffinity: ElementAffinity;
    spells: Spell[];
    items: Item[];
    statusEffects: StatusEffect[];
    combat: CombatState;
    eventIndex: number;
    narrativeLog: string[];
    xp: number;
}

export type GameState = {
    player: {
        stats: Stats;
        mana: Mana;
        type: Role;
        elementLevels: ElementLevels;
        elementAffinity: ElementAffinity;
        spells: Spell[];
        items: Item[];
        equipment: EquippedGear;
        statusEffects: StatusEffect[];
        skills: Skill[];
        xp: number;
    };

    combat: CombatState;

    narrative: {
        chapterId: string;
        nodeId: string;
        narrativeLog: string[];
    };
};
