import { getSpellById } from "../data/spells";
import type { CombatState } from "../types/combat-state.type";
import type { Enemy } from "../types/enemy.type";
import type {
    ElementAffinity,
    ElementLevels,
} from "../types/magic-element.type";
import type { Mana, Stats } from "../types/player.type";
import type { Spell } from "../types/spell.type";
import type { Skill } from "../types/skills.type";
import { getSkillById } from "../data/skills";
import type { StatusEffect } from "../types/status-effect.type";

// Aplica afinidad al coste de manÃ¡
export function getEffectiveCost(
    spell: Spell | Skill,
    affinity: ElementAffinity,
): number {
    if ("element" in spell) {
        return Math.round(spell.manaCost * (affinity[spell.element] ?? 1));
    }
    return spell.manaCost;
}

// Verifica si el player puede lanzar el hechizo
export function canCast(
    ability: Spell | Skill,
    mana: Mana,
    elementLevels: ElementLevels,
    affinity: ElementAffinity,
): boolean {
    if ("element" in ability) {
        if (elementLevels[ability.element] < ability.requiredLevel)
            return false;
    }
    const cost = getEffectiveCost(ability, affinity);
    if (ability.manaType === "mana") return mana.mana >= cost;
    if (ability.manaType === "celestial") return mana.celestial >= cost;
    if (ability.manaType === "infernal") return mana.infernal >= cost;
    return false;
}

/** Lanza un hechizo contra UN enemigo especÃ­fico */
export function castAbilitySingle(
    ability: Spell | Skill,
    mana: Mana,
    affinity: ElementAffinity,
    elementLevels: ElementLevels,
    enemy: Enemy,
    playerStats: Stats,
    playerEffects: StatusEffect[],
    magicalStrengthBonus: number = 0,
    physicalStrengthBonus: number = 0,
): {
    newMana: Mana;
    newEnemy: Enemy;
    newPlayerStats: Stats;
    newPlayerEffects: StatusEffect[];
    messages: string[];
    success: boolean;
} {
    const messages: string[] = [];

    if (!canCast(ability, mana, elementLevels, affinity)) {
        messages.push(
            `No puedes lanzar ${ability.name}: maná insuficiente o nivel bajo.`,
        );
        return {
            newMana: mana,
            newEnemy: enemy,
            newPlayerStats: playerStats,
            newPlayerEffects: playerEffects,
            messages,
            success: false,
        };
    }

    const cost = getEffectiveCost(ability, affinity);
    const newMana = { ...mana };
    if (ability.manaType === "mana") newMana.mana -= cost;
    if (ability.manaType === "celestial") newMana.celestial -= cost;
    if (ability.manaType === "infernal") newMana.infernal -= cost;

    let newEnemy = { ...enemy };
    let newPlayerStats = { ...playerStats };
    let newPlayerEffects = [...playerEffects];

    if (ability.targetType === "self") {
        if (ability.heal) {
            newPlayerStats.hp = Math.min(
                newPlayerStats.maxHp,
                newPlayerStats.hp + ability.heal,
            );
            messages.push(`${ability.name} → recuperas ${ability.heal} PV.`);
        }
        if (ability.effects) {
            for (const effect of ability.effects) {
                const existingEffect = newPlayerEffects.find(
                    (e) => e.type === effect!.type,
                );
                if (
                    effect.permanent ||
                    !newPlayerEffects.find((e) => e.type === effect!.type)
                ) {
                    newPlayerEffects.push({ ...effect });
                    messages.push(
                        `Tú: ${effect.type} (${effect.permanent ? "∞" : effect.duration + " turnos"}).`,
                    );
                } else {
                    existingEffect.duration = effect.duration;
                    messages.push(`🔄 Refrescado: ${effect.type}.`);
                }
            }
        }
        return {
            newMana,
            newEnemy,
            newPlayerStats,
            newPlayerEffects,
            messages,
            success: true,
        };
    }

    if (ability.damage) {
        let dmg = 0;
        let tag = "";
        if ("element" in ability) {
            const elementBonus = enemy.weakness === ability.element ? 1.5 : 1;
            const levelBonus = elementLevels[ability.element] * ability.damage;
            const rawDmg =
                (ability.damage + levelBonus + magicalStrengthBonus) *
                elementBonus;
            dmg = Math.max(1, Math.round(rawDmg - enemy.magicResistance / 3));
            tag = elementBonus > 1 ? " [DEBILIDAD!]" : "";
        } else {
            // Skill physical damage
            const rawDmg = ability.damage + physicalStrengthBonus;
            dmg = Math.max(1, Math.round(rawDmg - enemy.resistance / 2));
        }
        newEnemy.hp = Math.max(0, newEnemy.hp - dmg);
        messages.push(`${ability.name} → ${dmg} daño${tag} a ${enemy.name}.`);
    }

    if (ability.effects) {
        for (const effect of ability.effects) {
            if (
                effect.permanent ||
                !newEnemy.statusEffects.find((e) => e.type === effect!.type)
            ) {
                newEnemy.statusEffects = [
                    ...newEnemy.statusEffects,
                    { ...effect },
                ];
                messages.push(
                    `${enemy.name}: ${effect.type} (${effect.permanent ? "∞" : effect.duration + " turnos"}).`,
                );
            }
        }
    }

    return {
        newMana,
        newEnemy,
        newPlayerStats,
        newPlayerEffects,
        messages,
        success: true,
    };
}

/** Lanza un hechizo de área contra TODOS los enemigos vivos */
export function castAbilityArea(
    ability: Spell | Skill,
    mana: Mana,
    affinity: ElementAffinity,
    elementLevels: ElementLevels,
    enemies: Enemy[],
    playerStats: Stats,
    playerEffects: StatusEffect[],
    magicalStrengthBonus: number = 0,
    physicalStrengthBonus: number = 0,
): {
    newMana: Mana;
    newEnemies: Enemy[];
    newPlayerStats: Stats;
    newPlayerEffects: StatusEffect[];
    messages: string[];
    success: boolean;
} {
    const messages: string[] = [];

    if (!canCast(ability, mana, elementLevels, affinity)) {
        messages.push(
            `No puedes lanzar ${ability.name}: manÃ¡ insuficiente o nivel bajo.`,
        );
        return {
            newMana: mana,
            newEnemies: enemies,
            newPlayerStats: playerStats,
            newPlayerEffects: playerEffects,
            messages,
            success: false,
        };
    }

    const cost = getEffectiveCost(ability, affinity);
    const newMana = { ...mana };
    if (ability.manaType === "mana") newMana.mana -= cost;
    if (ability.manaType === "celestial") newMana.celestial -= cost;
    if (ability.manaType === "infernal") newMana.infernal -= cost;

    let newPlayerStats = { ...playerStats };
    let newPlayerEffects = [...playerEffects];

    if (ability.targetType === "self") {
        if (ability.heal) {
            newPlayerStats.hp = Math.min(
                newPlayerStats.maxHp,
                newPlayerStats.hp + ability.heal,
            );
            messages.push(`${ability.name} → recuperas ${ability.heal} PV.`);
        }
        if (ability.effects) {
            for (const effect of ability.effects) {
                if (
                    effect.permanent ||
                    !newPlayerEffects.find((e) => e.type === effect!.type)
                ) {
                    newPlayerEffects.push({ ...effect });
                    messages.push(
                        `Tú: ${effect.type} (${effect.permanent ? "∞" : effect.duration + " turnos"}).`,
                    );
                }
            }
        }
        return {
            newMana,
            newEnemies: enemies,
            newPlayerStats,
            newPlayerEffects,
            messages,
            success: true,
        };
    }

    const newEnemies = enemies.map((enemy) => {
        if (enemy.hp <= 0) return enemy; // ya muerto
        let newEnemy = { ...enemy };

        if (ability.damage) {
            let dmg = 0;
            let tag = "";
            if ("element" in ability) {
                const elementBonus =
                    enemy.weakness === ability.element ? 1.5 : 1;
                const levelBonus =
                    elementLevels[ability.element] * ability.damage;
                const rawDmg =
                    (ability.damage + levelBonus + magicalStrengthBonus) *
                    elementBonus;
                dmg = Math.max(
                    1,
                    Math.round(rawDmg - enemy.magicResistance / 3),
                );
                tag = elementBonus > 1 ? " [DEBILIDAD!]" : "";
            } else {
                const rawDmg = ability.damage + physicalStrengthBonus;
                dmg = Math.max(1, Math.round(rawDmg - enemy.resistance / 2));
            }
            newEnemy.hp = Math.max(0, newEnemy.hp - dmg);
            messages.push(
                `${ability.name} → ${dmg} daño${tag} a ${enemy.name}.`,
            );
        }

        if (ability.effects) {
            for (const effect of ability.effects) {
                if (
                    effect.permanent ||
                    !newEnemy.statusEffects.find((e) => e.type === effect!.type)
                ) {
                    newEnemy.statusEffects = [
                        ...newEnemy.statusEffects,
                        { ...effect },
                    ];
                    messages.push(`${enemy.name}: ${effect.type}.`);
                }
            }
        }

        return newEnemy;
    });

    return {
        newMana,
        newEnemies,
        newPlayerStats,
        newPlayerEffects,
        messages,
        success: true,
    };
}

export function applyEnemyStatusEffects(enemy: Enemy): {
    damage: number;
    newEnemy: Enemy;
    messages: string[];
} {
    let damage = 0;
    const messages: string[] = [];
    const updatedEffects = enemy.statusEffects
        .map((e) => {
            if (e.type === "ignition" || e.type === "burning") {
                damage += e.value ?? 5;
                messages.push(
                    `${enemy.name}: ${e.type} → ${e.value ?? 5} daño.`,
                );
            }
            if (e.type === "cursed") {
                damage += e.value ?? 3;
                messages.push(
                    `${enemy.name}: maldición → ${e.value ?? 3} daño.`,
                );
            }
            if (e.type === "poisoned") {
                damage += e.value ?? 4;
                messages.push(
                    `${enemy.name}: envenenado → ${e.value ?? 4} daño.`,
                );
            }
            if (e.permanent) return e;
            return { ...e, duration: e.duration - 1 };
        })
        .filter((e) => e.permanent || e.duration > 0);
    return {
        damage,
        newEnemy: {
            ...enemy,
            statusEffects: updatedEffects,
            hp: Math.max(0, enemy.hp - damage),
        },
        messages,
    };
}

export function applyPlayerStatusEffects(
    effects: StatusEffect[],
    stats: Stats,
): {
    newStats: Stats;
    damage: number;
    messages: string[];
    newEffects: StatusEffect[];
} {
    let damage = 0;
    const messages: string[] = [];

    const updatedEffects = effects
        .map((e) => {
            if (e.type === "poisoned") {
                damage += e.value ?? 4;
                messages.push(`Veneno → ${e.value ?? 4} daño.`);
            }
            // Importante: No restes duración si es permanente
            return e.permanent ? e : { ...e, duration: e.duration - 1 };
        })
        .filter((e) => e.permanent || e.duration > 0);

    return {
        newStats: { ...stats, hp: Math.max(0, stats.hp - damage) },
        damage,
        messages,
        newEffects: updatedEffects, // Asegúrate de usar estos en el setState principal
    };
}

/** Un enemigo específico ataca al jugador */
export function enemyAttack(
    enemy: Enemy,
    stats: Stats,
): { newStats: Stats; newEnemy: Enemy; messages: string[] } {
    const messages: string[] = [];
    let newEnemy = { ...enemy };

    const isStunned = enemy.statusEffects.some(
        (e) => e.type === "paralyzed" || e.type === "frozen",
    );
    if (isStunned) {
        messages.push(`${enemy.name} no puede actuar.`);
        return { newStats: stats, newEnemy, messages };
    }

    let abilityCast = false;
    let spellDmg = 0;
    let newStats = { ...stats };

    // Try to use skill first (40% chance if has skills)
    if (
        enemy.skills &&
        enemy.skills.length > 0 &&
        Math.random() > 0.4 &&
        !abilityCast
    ) {
        // Filtramos habilidades que ya tienen efectos activos para no spamear buffs
        const validSkills = enemy.skills
            .map((id) => getSkillById(id))
            .filter((s) => {
                if (!s) return false;
                if (s.targetType === "self" && s.effects) {
                    for (const effect of s.effects) {
                        const hasEffect = enemy.statusEffects.some(
                            (e) =>
                                e.type === effect!.type &&
                                (e.duration > 1 || e.permanent),
                        );
                        if (hasEffect) return false;
                    }
                }
                return true;
            }) as Skill[];

        if (validSkills.length > 0) {
            const skill =
                validSkills[Math.floor(Math.random() * validSkills.length)];
            abilityCast = true;
            if (skill.targetType === "self") {
                if (skill.effects) {
                    for (const effect of skill.effects) {
                        newEnemy.statusEffects = [
                            ...newEnemy.statusEffects,
                            { ...effect },
                        ];
                    }
                }
                messages.push(`${enemy.name} usa ${skill.name}.`);
            } else {
                if (skill.damage) {
                    const rawDmg = skill.damage + enemy.physical_strength;
                    spellDmg = Math.max(
                        1,
                        Math.round(rawDmg - stats.resistance / 2),
                    );
                    messages.push(
                        `${enemy.name} usa ${skill.name} → ${spellDmg} daño físico.`,
                    );
                } else {
                    messages.push(`${enemy.name} usa ${skill.name}.`);
                }
            }
        }
    }

    // Try to use spell next (40% chance if has spells and didn't use skill)
    if (
        enemy.spells &&
        enemy.spells.length > 0 &&
        Math.random() > 0.4 &&
        !abilityCast
    ) {
        // Filtramos hechizos redundantes
        const validSpells = enemy.spells
            .map((id) => getSpellById(id))
            .filter((s) => {
                if (!s) return false;
                if (s.targetType === "self") {
                    // No buffear si ya tiene el efecto
                    if (s.effects) {
                        for (const effect of s.effects) {
                            const hasEffect = enemy.statusEffects.some(
                                (e) =>
                                    e.type === effect!.type &&
                                    (e.duration > 1 || e.permanent),
                            );
                            if (hasEffect) return false;
                        }
                    }
                    // No curar si ya tiene vida alta
                    if (s.heal && enemy.hp > enemy.maxHp * 0.8) return false;
                }
                return true;
            }) as Spell[];

        if (validSpells.length > 0) {
            const spell =
                validSpells[Math.floor(Math.random() * validSpells.length)];
            abilityCast = true;
            if (spell.targetType === "self") {
                if (spell.effects) {
                    for (const effect of spell.effects) {
                        newEnemy.statusEffects = [
                            ...newEnemy.statusEffects,
                            { ...effect },
                        ];
                    }
                }
                if (spell.heal) {
                    newEnemy.hp = Math.min(
                        newEnemy.maxHp,
                        newEnemy.hp + spell.heal,
                    );
                }
                messages.push(`${enemy.name} lanza ${spell.name}.`);
            } else {
                if (spell.damage) {
                    const rawDmg = spell.damage + enemy.magical_strength;
                    spellDmg = Math.max(
                        1,
                        Math.round(rawDmg - stats.magicResistance / 2),
                    );
                    messages.push(
                        `${enemy.name} lanza ${spell.name} → ${spellDmg} daño mágico.`,
                    );
                } else {
                    messages.push(`${enemy.name} lanza ${spell.name}.`);
                }
            }
        }
    }

    if (abilityCast) {
        if (spellDmg > 0) {
            return {
                newStats: { ...stats, hp: Math.max(0, stats.hp - spellDmg) },
                newEnemy,
                messages,
            };
        }
        return { newStats, newEnemy, messages };
    }

    const dmg = Math.max(
        1,
        enemy.physical_strength - Math.floor(stats.resistance / 2),
    );
    messages.push(`${enemy.name} ataca → ${dmg} daño físico.`);

    return {
        newStats: { ...stats, hp: Math.max(0, stats.hp - dmg) },
        newEnemy,
        messages,
    };
}

/** Todos los enemigos vivos atacan en secuencia */
export function allEnemiesAttack(
    enemies: Enemy[],
    stats: Stats,
): { newStats: Stats; newEnemies: Enemy[]; messages: string[] } {
    let currentStats = { ...stats };
    const allMessages: string[] = [];
    const newEnemies = [];

    for (const enemy of enemies) {
        if (enemy.hp <= 0) {
            newEnemies.push(enemy);
            continue;
        }
        const { newStats, newEnemy, messages } = enemyAttack(
            enemy,
            currentStats,
        );
        currentStats = newStats;
        newEnemies.push(newEnemy || enemy);
        allMessages.push(...messages);
    }
    return { newStats: currentStats, newEnemies, messages: allMessages };
}

export function isEnemyDead(e: Enemy) {
    return e.hp <= 0;
}
export function allEnemiesDead(enemies: Enemy[]) {
    return enemies.every((e) => e.hp <= 0);
}
export function isPlayerDead(s: Stats) {
    return s.hp <= 0;
}

export function initCombat(enemies: Enemy[]): CombatState {
    const names = enemies.map((e) => e.name).join(", ");
    return {
        active: true,
        enemies: enemies.map((e) => ({ ...e, statusEffects: [] })),
        selectedEnemyIndex: 0,
        turn: "player",
        round: 1,
        log: [`Combate contra ${names}!`],
        comboSlot: [],
    };
}
