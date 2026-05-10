import type { CombatState } from "../types/combat-state.type";
import type { GameState } from "../types/game-state";
import type { Enemy } from "../types/enemy.type";
import type { Item } from "../types/item.type";
import type { ElementLevels } from "../types/magic-element.type";
import type { Mana, Stats } from "../types/player.type";
import type { Spell } from "../types/spell.type";
import type { View } from "../types/view.type";
import {
    applyEnemyStatusEffects,
    applyPlayerStatusEffects,
    allEnemiesAttack,
    allEnemiesDead,
    isPlayerDead,
    castAbilityArea,
    castAbilitySingle,
} from "../utils/combat";
import { getEffectiveStats, getEnemyEffectiveStats } from "../utils/equipment";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import type { Skill } from "../types/skills.type";

const MySwal = withReactContent(Swal);

interface Props {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    setGameOver: (gameOver: boolean) => void;
    setCombatResult: (result: "victory" | "defeat" | null) => void;
    setView: (view: View) => void;
    combat: CombatState;
    spells: Spell[];
    skills: Skill[];
    items: Item[];
    stats: Stats;
    mana: Mana;
}

const ELEMENT_ICON: Record<string, string> = {
    fire: "🔥",
    earth: "🪨",
    water: "💧",
    air: "🌪",
    light: "✨",
    darkness: "🌑",
    electric: "⚡",
    vital: "💛",
};

const MANA_COLOR: Record<string, string> = {
    mana: "#378ADD",
    celestial: "#FAC775",
    infernal: "#E24B4A",
};

export const COMBAT_ENEMIES = [
    "bandit",
    "wolf",
    "fire_sprite",
    "water_spirit",
    "shadow_assassin",
    "air_elemental",
];

export function CombatView({
    combat,
    spells,
    items,
    mana,
    state,
    skills,
    setState,
    setCombatResult,
    setView,
    setGameOver,
}: Props) {
    const living = combat.enemies.filter((e) => e.hp > 0);
    const selectedIdx = Math.min(
        combat.selectedEnemyIndex,
        living.length > 0 ? living.length - 1 : 0,
    );
    const targetEnemy = living[selectedIdx] ?? null;

    // ── Ataque físico ──────────────────────────────────────────────────────
    function handlePhysicalAttack() {
        if (!targetEnemy || combat.turn !== "player") return;

        const effectiveStats = getEffectiveStats(
            state.player.stats,
            state.player.equipment,
            state.player.statusEffects,
        );
        const dmg = Math.max(
            1,
            effectiveStats.physical_strength -
                Math.floor(targetEnemy.resistance / 2),
        );
        const weaponName =
            state.player.equipment.mainHand?.name ?? "Ataque físico";
        const actionLog = `${weaponName} → ${dmg} daño a ${targetEnemy.name}.`;

        // Actualizar el enemigo objetivo en el array
        const newEnemies = state.combat.enemies.map((e) =>
            e === targetEnemy ? { ...e, hp: Math.max(0, e.hp - dmg) } : e,
        );
        const newLog = [...state.combat.log, actionLog];

        // Recuperar mana con ataques físicos
        const normalGain = Math.floor(dmg / 4);
        const celestialGain = Math.floor(dmg / 12);
        const infernalGain = Math.floor(dmg / 12);

        const newNormalMana = Math.min(
            state.player.mana.maxMana,
            state.player.mana.mana + normalGain,
        );
        const newCelestialMana = Math.min(
            state.player.mana.maxCelestial,
            state.player.mana.celestial + celestialGain,
        );
        const newInfernalMana = Math.min(
            state.player.mana.maxInfernal,
            state.player.mana.infernal + infernalGain,
        );

        const newMana = {
            ...state.player.mana,
            mana: newNormalMana,
            celestial: newCelestialMana,
            infernal: newInfernalMana,
        };
        const playerUpdate = { ...state.player, mana: newMana };

        let logContent = `<div style="text-align:center;font-size:14px;margin-bottom:8px;"><i>"${actionLog}"</i></div>`;
        if (normalGain > 0 || celestialGain > 0 || infernalGain > 0) {
            logContent += `<div style="text-align:center;font-size:12px;">`;
            if (normalGain > 0)
                logContent += `<span style="color:#378ADD">💧 +${normalGain} Maná </span>`;
            if (celestialGain > 0)
                logContent += `<span style="color:#FAC775">✨ +${celestialGain} Celestial </span>`;
            if (infernalGain > 0)
                logContent += `<span style="color:#E24B4A">🔥 +${infernalGain} Infernal </span>`;
            logContent += `</div>`;
        }

        MySwal.fire({
            title: `<span style="color: #c9a84c; font-family: Georgia, serif">⚔ ${weaponName}</span>`,
            html: logContent,
            background: "#1a1a2e",
            color: "#eee",
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: "swal-custom-border" },
        }).then(() => {
            if (allEnemiesDead(newEnemies)) {
                handleVictory({
                    ...state,
                    player: playerUpdate,
                    combat: {
                        ...state.combat,
                        enemies: newEnemies,
                        log: newLog,
                    },
                });
                return;
            }
            // Ajustar selectedEnemyIndex si el objetivo murió
            const newLiving = newEnemies.filter((e) => e.hp > 0);
            const newSelected = Math.min(
                combat.selectedEnemyIndex,
                newLiving.length - 1,
            );
            doEnemyTurn({
                ...state,
                player: playerUpdate,
                combat: {
                    ...state.combat,
                    enemies: newEnemies,
                    selectedEnemyIndex: newSelected,
                    turn: "enemy",
                    log: newLog,
                },
            });
        });
    }

    // ── Habilidades (Hechizos y Skills) ────────────────────────────────────
    function handleCastAbility(ability: Spell | Skill) {
        if (combat.turn !== "player") return;

        const effectiveStats = getEffectiveStats(
            state.player.stats,
            state.player.equipment,
            state.player.statusEffects,
        );
        const magicBonus =
            effectiveStats.magical_strength -
            state.player.stats.magical_strength;
        const physicalBonus =
            effectiveStats.physical_strength -
            state.player.stats.physical_strength;

        if (ability.areaEffect) {
            // AOE: afecta a todos los enemigos vivos (o a ti mismo, manejado dentro de castAbilityArea)
            const {
                newMana,
                newEnemies,
                newPlayerStats,
                newPlayerEffects,
                messages,
                success,
            } = castAbilityArea(
                ability,
                state.player.mana,
                state.player.elementAffinity,
                state.player.elementLevels,
                state.combat.enemies,
                state.player.stats,
                state.player.statusEffects,
                magicBonus,
                physicalBonus,
            );
            const newLog = [...state.combat.log, ...messages];

            if (!success) {
                MySwal.fire({
                    title: '<span style="color: #c9a84c; font-family: Georgia, serif">Habilidad fallida</span>',
                    html: `<div style="text-align:center;font-size:14px;"><i>"${messages.join("<br>")}"</i></div>`,
                    background: "#1a1a2e",
                    color: "#eee",
                    confirmButtonColor: "#2a2a4a",
                    confirmButtonText: "Volver",
                    customClass: { popup: "swal-custom-border" },
                });
                setState({
                    ...state,
                    combat: { ...state.combat, log: newLog },
                });
                return;
            }

            MySwal.fire({
                title: `<span style="color:${MANA_COLOR[ability.manaType] || "#c9a84c"};font-family:Georgia,serif">💥 ${ability.name} [ÁREA]</span>`,
                html: messages
                    .map(
                        (m) =>
                            `<div style="text-align:center;font-size:13px;margin-bottom:3px;"><i>"${m}"</i></div>`,
                    )
                    .join(""),
                background: "#1a1a2e",
                color: "#eee",
                confirmButtonColor: "#2a2a4a",
                confirmButtonText: "Continuar",
                customClass: { popup: "swal-custom-border" },
            }).then(() => {
                if (allEnemiesDead(newEnemies)) {
                    const newLevels =
                        "element" in ability
                            ? grantXpToElement(
                                  state.player.elementLevels,
                                  ability.element,
                                  2,
                              )
                            : state.player.elementLevels;
                    handleVictory({
                        ...state,
                        player: {
                            ...state.player,
                            stats: newPlayerStats,
                            mana: newMana,
                            elementLevels: newLevels,
                            statusEffects: newPlayerEffects,
                        },
                        combat: {
                            ...state.combat,
                            enemies: newEnemies,
                            log: newLog,
                        },
                    });
                    return;
                }
                const newLiving = newEnemies.filter((e) => e.hp > 0);
                const newSelected = Math.min(
                    combat.selectedEnemyIndex,
                    newLiving.length - 1,
                );
                const newPlayer = {
                    ...state.player,
                    stats: newPlayerStats,
                    mana: newMana,
                    statusEffects: newPlayerEffects,
                };
                doEnemyTurn({
                    ...state,
                    player: newPlayer,
                    combat: {
                        ...state.combat,
                        enemies: newEnemies,
                        selectedEnemyIndex: newSelected,
                        turn: "enemy",
                        log: newLog,
                    },
                });
            });
        } else {
            // Objetivo único
            if (!targetEnemy && ability.targetType !== "self") return;
            const {
                newMana,
                newEnemy,
                newPlayerStats,
                newPlayerEffects,
                messages,
                success,
            } = castAbilitySingle(
                ability,
                state.player.mana,
                state.player.elementAffinity,
                state.player.elementLevels,
                targetEnemy || state.combat.enemies[0], // fallback if self target
                state.player.stats,
                state.player.statusEffects,
                magicBonus,
                physicalBonus,
            );
            const newEnemies = state.combat.enemies.map((e) =>
                e === targetEnemy ? newEnemy : e,
            );
            const newLog = [...state.combat.log, ...messages];

            if (!success) {
                MySwal.fire({
                    title: '<span style="color: #c9a84c; font-family: Georgia, serif">Habilidad fallida</span>',
                    html: `<div style="text-align:center;font-size:14px;"><i>"${messages.join("<br>")}"</i></div>`,
                    background: "#1a1a2e",
                    color: "#eee",
                    confirmButtonColor: "#2a2a4a",
                    confirmButtonText: "Volver",
                    customClass: { popup: "swal-custom-border" },
                });
                setState({
                    ...state,
                    combat: { ...state.combat, log: newLog },
                });
                return;
            }

            MySwal.fire({
                title: `<span style="color:${MANA_COLOR[ability.manaType] || "#c9a84c"};font-family:Georgia,serif">${ability.name}</span>`,
                html: messages
                    .map(
                        (m) =>
                            `<div style="text-align:center;font-size:13px;margin-bottom:3px;"><i>"${m}"</i></div>`,
                    )
                    .join(""),
                background: "#1a1a2e",
                color: "#eee",
                confirmButtonColor: "#2a2a4a",
                confirmButtonText: "Continuar",
                customClass: { popup: "swal-custom-border" },
            }).then(() => {
                if (allEnemiesDead(newEnemies)) {
                    const newLevels =
                        "element" in ability
                            ? grantXpToElement(
                                  state.player.elementLevels,
                                  ability.element,
                                  2,
                              )
                            : state.player.elementLevels;
                    handleVictory({
                        ...state,
                        player: {
                            ...state.player,
                            stats: newPlayerStats,
                            mana: newMana,
                            elementLevels: newLevels,
                            statusEffects: newPlayerEffects,
                        },
                        combat: {
                            ...state.combat,
                            enemies: newEnemies,
                            log: newLog,
                        },
                    });
                    return;
                }
                const newLiving = newEnemies.filter((e) => e.hp > 0);
                const newSelected = Math.min(
                    combat.selectedEnemyIndex,
                    newLiving.length - 1,
                );
                const newPlayer = {
                    ...state.player,
                    stats: newPlayerStats,
                    mana: newMana,
                    statusEffects: newPlayerEffects,
                };
                doEnemyTurn({
                    ...state,
                    player: newPlayer,
                    combat: {
                        ...state.combat,
                        enemies: newEnemies,
                        selectedEnemyIndex: newSelected,
                        turn: "enemy",
                        log: newLog,
                    },
                });
            });
        }
    }

    // ── Usar objeto ────────────────────────────────────────────────────────
    function handleUseItem(item: Item) {
        if (!item.usable || !item.onUse || item.quantity < 1) return;
        const updates = item.onUse(state.player.stats, state.player.mana);
        const newItems = state.player.items
            .map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i,
            )
            .filter((i) => i.quantity > 0 || !i.usable);
        const newPlayer = {
            ...state.player,
            stats: { ...state.player.stats, ...(updates as any) },
            mana: { ...state.player.mana, ...(updates as any) },
            items: newItems,
        };

        MySwal.fire({
            title: '<span style="color: #1D9E75; font-family: Georgia, serif">Objeto Usado</span>',
            html: `<div style="text-align:center;font-size:14px;"><i>"Usaste ${item.name}."</i></div>`,
            background: "#1a1a2e",
            color: "#eee",
            confirmButtonColor: "#2a2a4a",
            confirmButtonText: "Continuar",
            customClass: { popup: "swal-custom-border" },
        }).then(() => {
            doEnemyTurn({
                ...state,
                player: newPlayer,
                combat: {
                    ...state.combat,
                    turn: "enemy",
                    log: [...state.combat.log, `Usaste ${item.name}.`],
                },
            });
        });
    }

    // ── Huir ───────────────────────────────────────────────────────────────
    function handleFlee() {
        const success = Math.random() > 0.5;
        if (success) {
            setState({
                ...state,
                combat: {
                    ...state.combat,
                    active: false,
                    log: [...state.combat.log, "Huiste con éxito."],
                },
            });
            setCombatResult(null);
            setView("hub");
        } else {
            doEnemyTurn({
                ...state,
                combat: {
                    ...state.combat,
                    turn: "enemy",
                    log: [...state.combat.log, "No lograste escapar."],
                },
            });
        }
    }

    // ── Victoria ───────────────────────────────────────────────────────────
    function handleVictory(victoryState: GameState) {
        const totalXp = victoryState.combat.enemies.reduce(
            (acc, e) => acc + e.xpReward,
            0,
        );
        const finalLog = [
            ...victoryState.combat.log,
            `¡Victoria! +${totalXp} XP`,
        ];
        setState({
            ...victoryState,
            player: {
                ...victoryState.player,
                xp: victoryState.player.xp + totalXp,
            },
            combat: { ...victoryState.combat, active: false, log: finalLog },
        });
        setCombatResult("victory");
    }

    // ── Turno enemigo ──────────────────────────────────────────────────────
    function doEnemyTurn(currentState: GameState) {
        const { enemies } = currentState.combat;

        // Aplicar efectos de estado a cada enemigo vivo
        let statusMessages: string[] = [];
        let processedEnemies = enemies.map((enemy) => {
            if (enemy.hp <= 0) return enemy;
            const { newEnemy, messages } = applyEnemyStatusEffects(enemy);
            statusMessages.push(...messages);
            return newEnemy;
        });

        // Si todos murieron por efectos de estado
        if (allEnemiesDead(processedEnemies)) {
            const finalMessages = [
                ...statusMessages,
                "Todos los enemigos sucumben a sus efectos.",
            ];
            MySwal.fire({
                title: '<span style="color:#E24B4A;font-family:Georgia,serif">Turno Enemigo</span>',
                html: finalMessages
                    .map(
                        (m) =>
                            `<div style="text-align:center;font-size:13px;margin-bottom:3px;"><i>"${m}"</i></div>`,
                    )
                    .join(""),
                background: "#1a1a2e",
                color: "#eee",
                confirmButtonColor: "#2a2a4a",
                confirmButtonText: "Continuar",
                customClass: { popup: "swal-custom-border" },
            }).then(() => {
                handleVictory({
                    ...currentState,
                    combat: {
                        ...currentState.combat,
                        enemies: processedEnemies,
                        log: [...currentState.combat.log, ...finalMessages],
                    },
                });
            });
            return;
        }

        // Efectos de estado del jugador
        const {
            newStats: statsAfterStatus,
            messages: playerStatusMessages,
            newEffects,
        } = applyPlayerStatusEffects(
            currentState.player.statusEffects,
            currentState.player.stats,
        );

        // Todos los enemigos vivos atacan al jugador
        const effectiveDefense = getEffectiveStats(
            statsAfterStatus,
            currentState.player.equipment,
            currentState.player.statusEffects,
        );
        const enemiesWithStats = processedEnemies.map(getEnemyEffectiveStats);
        const {
            newStats: defendedStats,
            newEnemies: attackEnemies,
            messages: attackMessages,
        } = allEnemiesAttack(enemiesWithStats, effectiveDefense);

        // Map back HP and effect changes to base enemies to prevent stats from compounding
        const afterAttackEnemies = processedEnemies.map((baseEnemy, i) => {
            const attackEnemy = attackEnemies[i];
            return {
                ...baseEnemy,
                hp: attackEnemy.hp,
                statusEffects: attackEnemy.statusEffects,
            };
        });

        // Aplicar daño sobre los stats base
        const hpDiff = effectiveDefense.hp - defendedStats.hp;
        const newStats = {
            ...statsAfterStatus,
            hp: Math.max(0, statsAfterStatus.hp - hpDiff),
        };

        const allMessages = [
            ...statusMessages,
            ...playerStatusMessages,
            ...attackMessages,
        ];
        const newLog = [...currentState.combat.log, ...allMessages];

        MySwal.fire({
            title: '<span style="color:#E24B4A;font-family:Georgia,serif">Turno Enemigo</span>',
            html: allMessages
                .map(
                    (m) =>
                        `<div style="text-align:center;font-size:13px;margin-bottom:3px;"><i>"${m}"</i></div>`,
                )
                .join(""),
            background: "#1a1a2e",
            color: "#eee",
            confirmButtonColor: "#2a2a4a",
            confirmButtonText: "Tu Turno",
            customClass: { popup: "swal-custom-border" },
        }).then(() => {
            const newPlayer = {
                ...currentState.player,
                stats: newStats,
                statusEffects: newEffects,
            };
            if (isPlayerDead(newStats)) {
                setState({
                    ...currentState,
                    player: newPlayer,
                    combat: {
                        ...currentState.combat,
                        enemies: afterAttackEnemies,
                        turn: "player",
                        log: [...newLog, "Has caído..."],
                    },
                });
                setCombatResult("defeat");
                setGameOver(true);
                return;
            }
            setState({
                ...currentState,
                player: newPlayer,
                combat: {
                    ...currentState.combat,
                    enemies: afterAttackEnemies,
                    turn: "player",
                    round: currentState.combat.round + 1,
                    log: newLog,
                },
            });
        });
    }

    function grantXpToElement(
        levels: ElementLevels,
        element: keyof ElementLevels,
        amount: number,
    ): ElementLevels {
        return {
            ...levels,
            [element]: Math.min(100, levels[element] + amount),
        };
    }

    // ── Selección de objetivo ──────────────────────────────────────────────
    function selectTarget(enemy: Enemy) {
        const idx = combat.enemies.indexOf(enemy);
        if (idx !== -1) {
            setState({
                ...state,
                combat: { ...state.combat, selectedEnemyIndex: idx },
            });
        }
    }

    if (combat.enemies.length === 0) return null;

    const getEffectColor = (type) => {
        const buffs = ["fuerza", "escudo", "regeneracion", "agilidad"]; // Ajusta según tus tipos
        return buffs.includes(type.toLowerCase()) ? "#4caf50" : "#E24B4A";
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Enemies panel */}
            <div style={enemiesPanel}>
                <div
                    style={{
                        fontSize: 10,
                        color: "#666",
                        letterSpacing: 1.5,
                        marginBottom: 8,
                    }}
                >
                    ENEMIGOS — Ronda {combat.round}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {combat.enemies.map((enemy, idx) => {
                        const isDead = enemy.hp <= 0;
                        const isTarget =
                            !isDead &&
                            combat.enemies.indexOf(enemy) ===
                                combat.selectedEnemyIndex;
                        const hpPct = Math.round(
                            (enemy.hp / enemy.maxHp) * 100,
                        );
                        return (
                            <div
                                key={`${enemy.id}-${idx}`}
                                style={{
                                    ...enemyCard,
                                    opacity: isDead ? 0.35 : 1,
                                    flex: "1 1 140px",
                                    cursor: isDead ? "default" : "pointer",
                                    border: isTarget
                                        ? "1px solid #c9a84c99"
                                        : "1px solid #c94c4c22",
                                    position: "relative",
                                }}
                                onClick={() => !isDead && selectTarget(enemy)}
                            >
                                {isTarget && (
                                    <div style={targetBadge}>🎯 OBJETIVO</div>
                                )}
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: isDead ? "#555" : "#e55",
                                            }}
                                        >
                                            {isDead
                                                ? "💀"
                                                : ELEMENT_ICON[
                                                      enemy.element
                                                  ]}{" "}
                                            {enemy.name}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 9,
                                                color: "#666",
                                            }}
                                        >
                                            Nv {enemy.level}
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 10,
                                            color: "#aaa",
                                            textAlign: "right",
                                        }}
                                    >
                                        {isDead ? (
                                            <span style={{ color: "#333" }}>
                                                Muerto
                                            </span>
                                        ) : (
                                            `${enemy.hp}/${enemy.maxHp}`
                                        )}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        height: 4,
                                        background: "#222",
                                        borderRadius: 2,
                                        marginTop: 6,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${hpPct}%`,
                                            height: "100%",
                                            background:
                                                hpPct > 50
                                                    ? "#E24B4A"
                                                    : hpPct > 25
                                                      ? "#FAC775"
                                                      : "#555",
                                            borderRadius: 2,
                                            transition: "width 0.4s",
                                        }}
                                    />
                                </div>
                                {enemy.statusEffects.length > 0 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 3,
                                            flexWrap: "wrap",
                                            marginTop: 4,
                                        }}
                                    >
                                        {enemy.statusEffects.map((e, i) => (
                                            <span
                                                key={i}
                                                style={{
                                                    fontSize: 8,
                                                    color: getEffectColor(
                                                        e.type,
                                                    ), // Usa la función de color
                                                    background: "#12122a",
                                                    border: `1px solid ${getEffectColor(e.type)}22`, // Borde suave
                                                    padding: "1px 4px",
                                                    borderRadius: 3,
                                                }}
                                            >
                                                {e.type.toUpperCase()} (
                                                {e.duration})
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div style={section}>
                {state.player.statusEffects.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            gap: 4,
                            marginBottom: 10,
                            flexWrap: "wrap",
                        }}
                    >
                        {state.player.statusEffects.map((eff, i) => (
                            <div
                                key={i}
                                style={{
                                    fontSize: 10,
                                    background: "#1a1a2e",
                                    border: `1px solid ${getEffectColor(eff.type)}`,
                                    color: getEffectColor(eff.type),
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                }}
                            >
                                <span>✨ {eff.type}</span>
                                <span style={{ opacity: 0.7, fontSize: 9 }}>
                                    {eff.duration}t
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div style={sectionTitle}>
                    {combat.turn === "player" ? `Tu turno` : "Turno enemigo..."}
                </div>

                {/* Physical */}
                <div style={{ marginBottom: 8 }}>
                    <div style={subLabel}>ATAQUES</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                            style={actionBtn}
                            onClick={handlePhysicalAttack}
                            disabled={combat.turn !== "player" || !targetEnemy}
                        >
                            🗡️{" "}
                            {state.player.equipment.mainHand?.name ??
                                "Ataque físico"}
                            {targetEnemy && (
                                <span
                                    style={{
                                        color: "#888",
                                        marginLeft: 4,
                                        fontSize: 9,
                                    }}
                                >
                                    → {targetEnemy.name}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                        <div style={subLabel}>HABILIDADES (SKILLS)</div>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 5,
                            }}
                        >
                            {skills.map((skill) => {
                                const currentMana =
                                    skill.manaType === "mana"
                                        ? mana.mana
                                        : skill.manaType === "celestial"
                                          ? mana.celestial
                                          : mana.infernal;
                                const canCast =
                                    currentMana >= skill.manaCost &&
                                    combat.turn === "player";
                                return (
                                    <button
                                        key={skill.id}
                                        onClick={() => handleCastAbility(skill)}
                                        disabled={!canCast}
                                        style={{
                                            ...spellBtn,
                                            opacity: canCast ? 1 : 0.4,
                                            cursor: canCast
                                                ? "pointer"
                                                : "not-allowed",
                                            border: skill.areaEffect
                                                ? "1px solid #E24B4A55"
                                                : "1px solid #2a2a4a",
                                        }}
                                    >
                                        <span style={{ fontSize: 12 }}>⚔</span>
                                        <span style={{ fontSize: 10 }}>
                                            {skill.name}
                                        </span>
                                        {skill.areaEffect && (
                                            <span
                                                style={{
                                                    fontSize: 8,
                                                    color: "#E24B4A",
                                                }}
                                            >
                                                AOE
                                            </span>
                                        )}
                                        <span
                                            style={{
                                                fontSize: 9,
                                                color: MANA_COLOR[
                                                    skill.manaType
                                                ],
                                            }}
                                        >
                                            ✨{skill.manaCost}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Spells */}
                <div style={{ marginBottom: 8 }}>
                    <div style={subLabel}>
                        HECHIZOS
                        {targetEnemy && (
                            <span
                                style={{ color: "#888", fontWeight: "normal" }}
                            >
                                {" "}
                                — objetivo: {targetEnemy.name} (haz clic en un
                                enemigo para cambiar)
                            </span>
                        )}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {spells.map((spell) => {
                            const currentMana =
                                spell.manaType === "mana"
                                    ? mana.mana
                                    : spell.manaType === "celestial"
                                      ? mana.celestial
                                      : mana.infernal;
                            const canCast =
                                currentMana >= spell.manaCost &&
                                combat.turn === "player";
                            return (
                                <button
                                    key={spell.id}
                                    onClick={() => handleCastAbility(spell)}
                                    disabled={!canCast}
                                    style={{
                                        ...spellBtn,
                                        opacity: canCast ? 1 : 0.4,
                                        cursor: canCast
                                            ? "pointer"
                                            : "not-allowed",
                                        border: spell.areaEffect
                                            ? "1px solid #E24B4A55"
                                            : "1px solid #2a2a4a",
                                    }}
                                >
                                    <span style={{ fontSize: 12 }}>
                                        {ELEMENT_ICON[spell.element]}
                                    </span>
                                    <span style={{ fontSize: 10 }}>
                                        {spell.name}
                                    </span>
                                    {spell.areaEffect && (
                                        <span
                                            style={{
                                                fontSize: 8,
                                                color: "#E24B4A",
                                            }}
                                        >
                                            AOE
                                        </span>
                                    )}
                                    <span
                                        style={{
                                            fontSize: 9,
                                            color: MANA_COLOR[spell.manaType],
                                        }}
                                    >
                                        −{spell.manaCost}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Items */}
                <div style={{ marginBottom: 8 }}>
                    <div style={subLabel}>ITEMS</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {items
                            .filter((i) => i.usable)
                            .map((item) => (
                                <button
                                    key={item.id}
                                    style={actionBtn}
                                    onClick={() => handleUseItem(item)}
                                    disabled={combat.turn !== "player"}
                                >
                                    {item.icon} {item.name}
                                </button>
                            ))}
                    </div>
                </div>

                {/* Other */}
                <div>
                    <div style={subLabel}>OTROS</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                            style={{
                                ...actionBtn,
                                color: "#E24B4A",
                                borderColor: "#E24B4A44",
                            }}
                            onClick={handleFlee}
                            disabled={combat.turn !== "player"}
                        >
                            ↩ Huir
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const enemiesPanel: React.CSSProperties = {
    background: "#1a1a2e",
    border: "1px solid #2a1a1a",
    borderRadius: 8,
    padding: 12,
};
const enemyCard: React.CSSProperties = {
    background: "#12122a",
    borderRadius: 8,
    padding: 10,
    transition: "border 0.2s",
};
const targetBadge: React.CSSProperties = {
    position: "absolute",
    top: -8,
    left: 8,
    fontSize: 8,
    color: "#c9a84c",
    background: "#1a1a2e",
    padding: "1px 5px",
    borderRadius: 4,
    letterSpacing: 1,
};
const section: React.CSSProperties = {
    background: "#1a1a2e",
    border: "1px solid #222",
    borderRadius: 8,
    padding: 12,
};
const sectionTitle: React.CSSProperties = {
    fontSize: 11,
    letterSpacing: 1.5,
    color: "#c9a84c",
    marginBottom: 10,
};
const subLabel: React.CSSProperties = {
    fontSize: 10,
    color: "#555",
    letterSpacing: 1.5,
    marginBottom: 6,
};
const spellBtn: React.CSSProperties = {
    background: "#12122a",
    borderRadius: 6,
    padding: "5px 10px",
    display: "flex",
    alignItems: "center",
    gap: 5,
    color: "#ccc",
    fontFamily: "Georgia, serif",
};
const actionBtn: React.CSSProperties = {
    background: "#12122a",
    border: "1px solid #2a2a4a",
    borderRadius: 6,
    padding: "7px 12px",
    color: "#ccc",
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "Georgia, serif",
};
