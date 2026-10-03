import type { MagicElement } from "./magic-element.type";
import type { StatusEffect } from "./status-effect.type";

export interface BossPhase {
  /** Se activa al bajar de este % de PV (ordena las fases de mayor a menor) */
  hpBelowPct: number;
  message: string;
  /** Se SUMAN a los stats actuales (pueden ser negativos) */
  buffs?: Partial<
    Pick<
      Enemy,
      | "physical_strength"
      | "magical_strength"
      | "speed"
      | "resistance"
      | "magicResistance"
    >
  >;
  addSkills?: string[];
  addSpells?: string[];
  addEffects?: StatusEffect[];
  healPct?: number;
  /** IDs de enemigos a invocar (máx. 4 enemigos en total) */
  summon?: string[];
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  physical_strength: number;
  magical_strength: number;
  resistance: number;
  magicResistance: number;
  speed: number;
  element: MagicElement;
  weakness?: MagicElement; // recibe +50% daño
  immunity?: MagicElement; // inmune a ese elemento
  statusEffects: StatusEffect[];
  spells: string[];
  skills: string[];
  xpReward: number;
  lootTable?: string[]; // ids de ítems posibles
  phases?: BossPhase[];
  phase?: number;
}
