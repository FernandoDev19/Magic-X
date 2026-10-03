import type { CombatState } from "./combat-state.type";
import type { EquippedGear } from "./equipment.type";
import type { Item } from "./item.type";
import type { ElementAffinity, ElementLevels } from "./magic-element.type";
import type { Mana, Role, Stats } from "./player.type";
import type { Skill } from "./skills.type";
import type { Spell } from "./spell.type";
import type { StatusEffect } from "./status-effect.type";

import type { Companion } from "./companion.type";
import type { ChapterMap } from "./map.type";
import type { Quest, QuestRef } from "./quest.type";
import type { View } from "./view.type";

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
  xp?: number;
}

export interface Condition {
  flag?: string;
  notFlag?: string;
  minCorruption?: number;
  maxCorruption?: number;
  minSanity?: number;
  maxSanity?: number;
  companion?: string; // debe estar reclutado
  notCompanion?: string;
}

export interface StoryOption {
  text: string;
  effect?: NarrativeEffect;
  consequence?: string;
  nextNodeId?: string;
  triggerEnemyId?: string;
  returnToHub?: boolean;
  nextChapterId?: string;
  when?: Condition; // la opción solo aparece si se cumple
  setFlags?: Record<string, boolean | number>;
  completes?: QuestRef[];
  recruitCompanion?: string;
  endGame?: boolean;
}

export interface StoryNode {
  id: string;
  speaker?: string;
  text: string;
  options?: StoryOption[];
  nextNodeId?: string;
  triggerEnemyId?: string;
  returnToHub?: boolean;
  nextChapterId?: string;
  /** Cambia texto/orador si se cumple la condición (gana la primera) */
  variants?: { when: Condition; text: string; speaker?: string }[];
  /** Líneas extra de compañeros u otros personajes */
  reactions?: { when: Condition; speaker: string; text: string }[];
  /** Bloquea el nodo hasta que exista el flag (se activa desde el mapa) */
  gate?: { flag: string; text: string };
  setFlags?: Record<string, boolean | number>;
  completes?: QuestRef[];
  recruitCompanion?: string;
  endGame?: boolean;
  bg?: string;
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
    party: Companion[];
    level: number;
  };

  combat: CombatState;

  narrative: {
    chapterId: string;
    nodeId: string;
    narrativeLog: string[];
  };

  mapState?: ChapterMap;
  quests: Quest[];
  flags: Record<string, boolean | number>;
  scene?: { sceneId: string; nodeId: string } | null;
  returnTo?: View;
};
