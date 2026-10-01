import { useState } from "react";
import type { CombatState } from "../types/combat-state.type";
import type { GameState } from "../types/game-state";
import type { Enemy } from "../types/enemy.type";
import type { Item } from "../types/item.type";
import type { ElementLevels } from "../types/magic-element.type";
import type { Mana, Stats } from "../types/player.type";
import type { Spell } from "../types/spell.type";
import type { View } from "../types/view.type";
import type { Skill } from "../types/skills.type";
import type { Companion } from "../types/companion.type";
import { CompanionPanel } from "../components/CompanionPanel";
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
import { resolveLoot, mergeLootIntoInventory } from "../utils/loot";
import { CombatLog } from "../components/CombatLog";
import { getSanityEffects } from "../utils/mental-effects";


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
    fire: "🔥", earth: "🪨", water: "💧", air: "🌪",
    light: "✨", darkness: "🌑", electric: "⚡", vital: "💛",
};

const MANA_COLOR: Record<string, string> = {
    mana: "#378ADD",
    celestial: "#FAC775",
    infernal: "#E24B4A",
};

export const COMBAT_ENEMIES = [
    "bandit", "wolf", "fire_sprite", "water_spirit",
    "shadow_assassin", "air_elemental",
];

function addLog(state: GameState, ...lines: string[]): GameState {
    return {
        ...state,
        combat: {
            ...state.combat,
            log: [...state.combat.log, ...lines],
        },
    };
}

export function CombatView({
    combat, spells, items, mana, state, skills,
    setState, setCombatResult, setView, setGameOver,
}: Props) {
    const [animatingEnemyIdx, setAnimatingEnemyIdx] = useState<number | null>(null);
    const [animatingPlayer, setAnimatingPlayer] = useState(false);

    const living = combat.enemies.filter((e) => e.hp > 0);
    const selectedIdx = Math.min(combat.selectedEnemyIndex, living.length > 0 ? living.length - 1 : 0);
    const targetEnemy = living[selectedIdx] ?? null;

    const sanityEff = getSanityEffects(state.player.stats.sanity);

    function flashEnemy(idx: number) {
        setAnimatingEnemyIdx(idx);
        setTimeout(() => setAnimatingEnemyIdx(null), 400);
    }
    function flashPlayer() {
        setAnimatingPlayer(true);
        setTimeout(() => setAnimatingPlayer(false), 400);
    }

    // ── Physical attack ────────────────────────────────────────────────────
    function handlePhysicalAttack() {
        if (!targetEnemy || combat.turn !== "player") return;

        // Sanity miss chance
        if (Math.random() < sanityEff.missChance) {
            const s = addLog(state, `Tu mente falla... el ataque se pierde en el aire.`);
            doEnemyTurn({ ...s, combat: { ...s.combat, turn: "enemy" } });
            return;
        }

        const effectiveStats = getEffectiveStats(state.player.stats, state.player.equipment, state.player.statusEffects);
        const dmg = Math.max(1, effectiveStats.physical_strength - Math.floor(targetEnemy.resistance / 2));
        const weaponName = state.player.equipment.mainHand?.name ?? "Ataque físico";

        flashEnemy(combat.selectedEnemyIndex);

        const newEnemies = state.combat.enemies.map((e) =>
            e === targetEnemy ? { ...e, hp: Math.max(0, e.hp - dmg) } : e,
        );

        const normalGain = Math.floor(dmg / 4);
        const celestialGain = Math.floor(dmg / 12);
        const infernalGain = Math.floor(dmg / 12);
        const newMana = {
            ...state.player.mana,
            mana: Math.min(state.player.mana.maxMana, state.player.mana.mana + normalGain),
            celestial: Math.min(state.player.mana.maxCelestial, state.player.mana.celestial + celestialGain),
            infernal: Math.min(state.player.mana.maxInfernal, state.player.mana.infernal + infernalGain),
        };

        const logLines = [`${weaponName} → ${dmg} daño a ${targetEnemy.name}.`];
        if (normalGain > 0) logLines.push(`💧 +${normalGain} Maná por combate.`);

        let ns: GameState = {
            ...state,
            player: { ...state.player, mana: newMana },
            combat: { ...state.combat, enemies: newEnemies, log: [...state.combat.log, ...logLines] },
        };

        if (allEnemiesDead(newEnemies)) {
            handleVictory(ns);
            return;
        }

        const newLiving = newEnemies.filter((e) => e.hp > 0);
        const newSelected = Math.min(combat.selectedEnemyIndex, newLiving.length - 1);
        doEnemyTurn({ ...ns, combat: { ...ns.combat, enemies: newEnemies, selectedEnemyIndex: newSelected, turn: "enemy" } });
    }

    // ── Cast ability ───────────────────────────────────────────────────────
    function handleCastAbility(ability: Spell | Skill) {
        if (combat.turn !== "player") return;

        // Sanity miss chance
        if (Math.random() < sanityEff.missChance) {
            const s = addLog(state, `Tu mente fragmentada interrumpe el hechizo.`);
            doEnemyTurn({ ...s, combat: { ...s.combat, turn: "enemy" } });
            return;
        }

        const effectiveStats = getEffectiveStats(state.player.stats, state.player.equipment, state.player.statusEffects);
        const magicBonus = effectiveStats.magical_strength - state.player.stats.magical_strength;
        const physicalBonus = effectiveStats.physical_strength - state.player.stats.physical_strength;

        if (ability.areaEffect) {
            const { newMana, newEnemies, newPlayerStats, newPlayerEffects, messages, success } =
                castAbilityArea(ability, state.player.mana, state.player.elementAffinity, state.player.elementLevels,
                    state.combat.enemies, state.player.stats, state.player.statusEffects, magicBonus, physicalBonus);

            if (!success) {
                setState(addLog(state, ...messages));
                return;
            }

            const ns: GameState = {
                ...state,
                player: { ...state.player, stats: newPlayerStats, mana: newMana, statusEffects: newPlayerEffects },
                combat: { ...state.combat, enemies: newEnemies, log: [...state.combat.log, ...messages] },
            };

            if (allEnemiesDead(newEnemies)) {
                handleVictory({ ...ns, player: { ...ns.player, elementLevels: "element" in ability ? grantXpToElement(state.player.elementLevels, ability.element, 2) : state.player.elementLevels } });
                return;
            }

            const newLiving = newEnemies.filter((e) => e.hp > 0);
            doEnemyTurn({ ...ns, combat: { ...ns.combat, selectedEnemyIndex: Math.min(combat.selectedEnemyIndex, newLiving.length - 1), turn: "enemy" } });
        } else {
            if (!targetEnemy && ability.targetType !== "self") return;

            const { newMana, newEnemy, newPlayerStats, newPlayerEffects, messages, success } =
                castAbilitySingle(ability, state.player.mana, state.player.elementAffinity, state.player.elementLevels,
                    targetEnemy || state.combat.enemies[0], state.player.stats, state.player.statusEffects, magicBonus, physicalBonus);

            if (!success) {
                setState(addLog(state, ...messages));
                return;
            }

            if (ability.targetType !== "self") flashEnemy(combat.selectedEnemyIndex);

            const newEnemies = state.combat.enemies.map((e) => e === targetEnemy ? newEnemy : e);
            const ns: GameState = {
                ...state,
                player: { ...state.player, stats: newPlayerStats, mana: newMana, statusEffects: newPlayerEffects },
                combat: { ...state.combat, enemies: newEnemies, log: [...state.combat.log, ...messages] },
            };

            if (allEnemiesDead(newEnemies)) {
                handleVictory({ ...ns, player: { ...ns.player, elementLevels: "element" in ability ? grantXpToElement(state.player.elementLevels, ability.element, 2) : state.player.elementLevels } });
                return;
            }

            const newLiving = newEnemies.filter((e) => e.hp > 0);
            doEnemyTurn({ ...ns, combat: { ...ns.combat, selectedEnemyIndex: Math.min(combat.selectedEnemyIndex, newLiving.length - 1), turn: "enemy" } });
        }
    }

    // ── Use item ───────────────────────────────────────────────────────────
    function handleUseItem(item: Item) {
        if (!item.usable || !item.onUse || item.quantity < 1) return;
        const updates = item.onUse(state.player.stats, state.player.mana);
        const newItems = state.player.items
            .map((i) => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i)
            .filter((i) => i.quantity > 0 || !i.usable);

        const newPlayer = {
            ...state.player,
            stats: { ...state.player.stats, ...(updates as any) },
            mana: { ...state.player.mana, ...(updates as any) },
            items: newItems,
        };

        const ns: GameState = addLog({ ...state, player: newPlayer }, `Usaste ${item.icon} ${item.name}.`);
        doEnemyTurn({ ...ns, combat: { ...ns.combat, turn: "enemy" } });
    }

    // ── Flee ───────────────────────────────────────────────────────────────
    function handleFlee() {
        if (Math.random() > 0.5) {
            setState(addLog(state, "Huiste con éxito."));
            setCombatResult(null);
            setView("hub");
        } else {
            doEnemyTurn(addLog({ ...state, combat: { ...state.combat, turn: "enemy" } }, "No lograste escapar."));
        }
    }

    // ── Companion skill action ─────────────────────────────────────────────
    function handleCompanionSkillUse(companion: Companion, skillIndex: number) {
        if (combat.turn !== "player") return;
        const skill = companion.skills[skillIndex];
        if (!skill || companion.mana.mana < skill.manaCost) return;

        let dmg = skill.damage ?? 20;
        let logMsg = "";
        let newEnemies = state.combat.enemies;
        let newPlayerStats = state.player.stats;

        if (dmg < 0) {
            const healAmt = Math.abs(dmg);
            newPlayerStats = {
                ...newPlayerStats,
                hp: Math.min(newPlayerStats.maxHp, newPlayerStats.hp + healAmt),
            };
            logMsg = `✨ ${companion.name} canaliza ${skill.name} y restaña ${healAmt} PV al jugador.`;
        } else {
            if (!targetEnemy) return;
            newEnemies = state.combat.enemies.map((e) =>
                e === targetEnemy ? { ...e, hp: Math.max(0, e.hp - dmg) } : e
            );
            logMsg = `⚔️ ${companion.name} ejecuta ${skill.name} causando ${dmg} de daño a ${targetEnemy.name}.`;
        }

        const newParty = (state.player.party ?? []).map((c) =>
            c.id === companion.id
                ? { ...c, mana: { ...c.mana, mana: Math.max(0, c.mana.mana - skill.manaCost) } }
                : c
        );

        const ns: GameState = {
            ...state,
            player: { ...state.player, stats: newPlayerStats, party: newParty },
            combat: { ...state.combat, enemies: newEnemies, log: [...state.combat.log, logMsg] },
        };

        if (allEnemiesDead(newEnemies)) {
            handleVictory(ns);
            return;
        }

        doEnemyTurn({ ...ns, combat: { ...ns.combat, turn: "enemy" } });
    }


    // ── Victory with loot ─────────────────────────────────────────────────
    function handleVictory(victoryState: GameState) {
        const loot = resolveLoot(victoryState.combat.enemies);
        const newItems = mergeLootIntoInventory(victoryState.player.items, loot);

        const lootLines: string[] = [];
        lootLines.push(`--- Victoria! +${loot.xp} XP ---`);
        if (loot.gold > 0) lootLines.push(`💰 +${loot.gold} monedas de oro.`);
        for (const item of loot.items) {
            lootLines.push(`Obtienes: ${item.icon} ${item.name} x${item.quantity}.`);
        }
        if (loot.items.length === 0 && loot.gold === 0) {
            lootLines.push("Los enemigos no dejaron nada.");
        }

        setState({
            ...victoryState,
            player: {
                ...victoryState.player,
                xp: victoryState.player.xp + loot.xp,
                items: newItems,
            },
            combat: {
                ...victoryState.combat,
                active: false,
                log: [...victoryState.combat.log, ...lootLines],
            },
        });
        setCombatResult("victory");
    }

    // ── Enemy turn ─────────────────────────────────────────────────────────
    function doEnemyTurn(currentState: GameState) {
        const { enemies } = currentState.combat;

        let statusMessages: string[] = [];
        let processedEnemies = enemies.map((enemy) => {
            if (enemy.hp <= 0) return enemy;
            const { newEnemy, messages } = applyEnemyStatusEffects(enemy);
            statusMessages.push(...messages);
            return newEnemy;
        });

        if (allEnemiesDead(processedEnemies)) {
            handleVictory({
                ...currentState,
                combat: { ...currentState.combat, enemies: processedEnemies, log: [...currentState.combat.log, ...statusMessages, "Todos los enemigos caen."] },
            });
            return;
        }

        flashPlayer();

        const { newStats: statsAfterStatus, messages: playerStatusMessages, newEffects } =
            applyPlayerStatusEffects(currentState.player.statusEffects, currentState.player.stats);

        const effectiveDefense = getEffectiveStats(statsAfterStatus, currentState.player.equipment, currentState.player.statusEffects);
        const enemiesWithStats = processedEnemies.map(getEnemyEffectiveStats);
        const { newStats: defendedStats, newEnemies: attackEnemies, messages: attackMessages } =
            allEnemiesAttack(enemiesWithStats, effectiveDefense);

        const afterAttackEnemies = processedEnemies.map((baseEnemy, i) => {
            const attackEnemy = attackEnemies[i];
            return { ...baseEnemy, hp: attackEnemy.hp, statusEffects: attackEnemy.statusEffects };
        });

        const hpDiff = effectiveDefense.hp - defendedStats.hp;
        const newStats = { ...statsAfterStatus, hp: Math.max(0, statsAfterStatus.hp - hpDiff) };

        const allMessages = [...statusMessages, ...playerStatusMessages, ...attackMessages];
        const newLog = [...currentState.combat.log, `--- Turno enemigo (Ronda ${currentState.combat.round}) ---`, ...allMessages];

        const newPlayer = { ...currentState.player, stats: newStats, statusEffects: newEffects };

        if (isPlayerDead(newStats)) {
            setState({
                ...currentState,
                player: newPlayer,
                combat: { ...currentState.combat, enemies: afterAttackEnemies, turn: "player", log: [...newLog, "Has caído en combate..."] },
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
    }

    function grantXpToElement(levels: ElementLevels, element: keyof ElementLevels, amount: number): ElementLevels {
        return { ...levels, [element]: Math.min(100, levels[element] + amount) };
    }

    function selectTarget(enemy: Enemy) {
        const idx = combat.enemies.indexOf(enemy);
        if (idx !== -1) setState({ ...state, combat: { ...state.combat, selectedEnemyIndex: idx } });
    }

    const getEffectColor = (type: string) => {
        const buffs = ["strengthened", "velocitized", "invisible"];
        return buffs.includes(type) ? "#5DCAA5" : "#E24B4A";
    };

    if (combat.enemies.length === 0) return null;

    const isPlayerTurn = combat.turn === "player";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Sanity warning */}
            {sanityEff.message && (
                <div style={{ background: "#7F77DD22", border: "1px solid #7F77DD44", borderRadius: 6, padding: "6px 12px", fontSize: 11, color: "#AFA9EC" }}>
                    🧠 {sanityEff.message}
                </div>
            )}

            {/* Enemies panel */}
            <div style={enemiesPanel}>
                <div style={{ fontSize: 10, color: "#666", letterSpacing: 1.5, marginBottom: 8 }}>
                    ENEMIGOS — Ronda {combat.round}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {combat.enemies.map((enemy, idx) => {
                        const isDead = enemy.hp <= 0;
                        const isTarget = !isDead && combat.enemies.indexOf(enemy) === combat.selectedEnemyIndex;
                        const hpPct = Math.round((enemy.hp / enemy.maxHp) * 100);
                        const isAnimating = animatingEnemyIdx === idx;

                        return (
                            <div
                                key={`${enemy.id}-${idx}`}
                                style={{
                                    ...enemyCard,
                                    opacity: isDead ? 0.35 : 1,
                                    flex: "1 1 140px",
                                    cursor: isDead ? "default" : "pointer",
                                    border: isTarget ? "1px solid #c9a84c99" : "1px solid #c94c4c22",
                                    position: "relative",
                                    transform: isAnimating ? "scale(0.96)" : "scale(1)",
                                    transition: "transform 0.15s, background 0.15s",
                                    background: isAnimating ? "#2a0a0a" : "#12122a",
                                }}
                                onClick={() => !isDead && selectTarget(enemy)}
                            >
                                {isTarget && <div style={targetBadge}>🎯 OBJETIVO</div>}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: isDead ? "#555" : "#e55" }}>
                                            {isDead ? "💀" : ELEMENT_ICON[enemy.element]} {enemy.name}
                                        </div>
                                        <div style={{ fontSize: 9, color: "#666" }}>Nv {enemy.level}</div>
                                    </div>
                                    <div style={{ fontSize: 10, color: "#aaa", textAlign: "right" }}>
                                        {isDead ? <span style={{ color: "#333" }}>Muerto</span> : `${enemy.hp}/${enemy.maxHp}`}
                                    </div>
                                </div>
                                <div style={{ height: 4, background: "#222", borderRadius: 2, marginTop: 6 }}>
                                    <div style={{
                                        width: `${hpPct}%`, height: "100%",
                                        background: hpPct > 50 ? "#E24B4A" : hpPct > 25 ? "#FAC775" : "#555",
                                        borderRadius: 2, transition: "width 0.4s",
                                    }} />
                                </div>
                                {enemy.statusEffects.length > 0 && (
                                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 4 }}>
                                        {enemy.statusEffects.map((e, i) => (
                                            <span key={i} style={{ fontSize: 8, color: getEffectColor(e.type), background: "#12122a", border: `1px solid ${getEffectColor(e.type)}22`, padding: "1px 4px", borderRadius: 3 }}>
                                                {e.type.toUpperCase()} ({e.duration})
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Combat log */}
            <CombatLog log={combat.log} round={combat.round} turn={combat.turn} />

            {/* Player status effects */}
            {state.player.statusEffects.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {state.player.statusEffects.map((eff, i) => (
                        <div key={i} style={{ fontSize: 10, background: "#1a1a2e", border: `1px solid ${getEffectColor(eff.type)}`, color: getEffectColor(eff.type), padding: "2px 6px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <span>✨ {eff.type}</span>
                            <span style={{ opacity: 0.7, fontSize: 9 }}>{eff.duration}t</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Player HP bar */}
            <div style={{ background: "#1a1a2e", border: "1px solid #222", borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666", marginBottom: 4 }}>
                    <span style={{ color: animatingPlayer ? "#E24B4A" : "#888" }}>TU VIDA</span>
                    <span style={{ color: "#ccc" }}>{state.player.stats.hp}/{state.player.stats.maxHp}</span>
                </div>
                <div style={{ height: 6, background: "#222", borderRadius: 3 }}>
                    <div style={{ width: `${(state.player.stats.hp / state.player.stats.maxHp) * 100}%`, height: "100%", background: state.player.stats.hp > 50 ? "#1D9E75" : state.player.stats.hp > 25 ? "#FAC775" : "#E24B4A", borderRadius: 3, transition: "width 0.4s, background 0.4s" }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                    {[
                        { label: "Maná", value: mana.mana, max: mana.maxMana, color: "#378ADD" },
                        { label: "Celestial", value: mana.celestial, max: mana.maxCelestial, color: "#FAC775" },
                        { label: "Infernal", value: mana.infernal, max: mana.maxInfernal, color: "#7F77DD" },
                    ].map(({ label, value, max, color }) => (
                        <div key={label} style={{ flex: 1, minWidth: 60 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#555" }}>
                                <span>{label}</span><span style={{ color }}>{value}/{max}</span>
                            </div>
                            <div style={{ height: 3, background: "#222", borderRadius: 2 }}>
                                <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.3s" }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Active Party Panel in Combat */}
            {state.player.party && state.player.party.some((c) => c.isRecruited && c.isActive) && (
                <CompanionPanel
                    party={state.player.party}
                    isCombat={true}
                    onCompanionSkillUse={handleCompanionSkillUse}
                />
            )}


            {/* Actions */}
            <div style={section}>
                <div style={sectionTitle}>{isPlayerTurn ? "Tu turno — ¿Qué harás?" : "Turno enemigo..."}</div>

                {/* Physical */}
                <div style={{ marginBottom: 8 }}>
                    <div style={subLabel}>ATAQUES</div>
                    <button style={{ ...actionBtn, opacity: isPlayerTurn && targetEnemy ? 1 : 0.4 }} onClick={handlePhysicalAttack} disabled={!isPlayerTurn || !targetEnemy}>
                        🗡️ {state.player.equipment.mainHand?.name ?? "Ataque físico"}
                        {targetEnemy && <span style={{ color: "#888", marginLeft: 4, fontSize: 9 }}>→ {targetEnemy.name}</span>}
                    </button>
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                        <div style={subLabel}>HABILIDADES</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {skills.map((skill) => {
                                const currentMana = skill.manaType === "mana" ? mana.mana : skill.manaType === "celestial" ? mana.celestial : mana.infernal;
                                const canCast = currentMana >= skill.manaCost && isPlayerTurn;
                                return (
                                    <button key={skill.id} onClick={() => handleCastAbility(skill)} disabled={!canCast}
                                        style={{ ...spellBtn, opacity: canCast ? 1 : 0.4, cursor: canCast ? "pointer" : "not-allowed", border: skill.areaEffect ? "1px solid #E24B4A55" : "1px solid #2a2a4a" }}>
                                        <span style={{ fontSize: 12 }}>⚔</span>
                                        <span style={{ fontSize: 10 }}>{skill.name}</span>
                                        {skill.areaEffect && <span style={{ fontSize: 8, color: "#E24B4A" }}>AOE</span>}
                                        <span style={{ fontSize: 9, color: MANA_COLOR[skill.manaType] }}>✨{skill.manaCost}</span>
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
                        {targetEnemy && <span style={{ color: "#888", fontWeight: "normal" }}> — objetivo: {targetEnemy.name}</span>}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {spells.map((spell) => {
                            const currentMana = spell.manaType === "mana" ? mana.mana : spell.manaType === "celestial" ? mana.celestial : mana.infernal;
                            const canCast = currentMana >= spell.manaCost && isPlayerTurn;
                            return (
                                <button key={spell.id} onClick={() => handleCastAbility(spell)} disabled={!canCast}
                                    style={{ ...spellBtn, opacity: canCast ? 1 : 0.4, cursor: canCast ? "pointer" : "not-allowed", border: spell.areaEffect ? "1px solid #E24B4A55" : "1px solid #2a2a4a" }}>
                                    <span style={{ fontSize: 12 }}>{ELEMENT_ICON[spell.element]}</span>
                                    <span style={{ fontSize: 10 }}>{spell.name}</span>
                                    {spell.areaEffect && <span style={{ fontSize: 8, color: "#E24B4A" }}>AOE</span>}
                                    <span style={{ fontSize: 9, color: MANA_COLOR[spell.manaType] }}>−{spell.manaCost}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Items */}
                <div style={{ marginBottom: 8 }}>
                    <div style={subLabel}>ITEMS</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {items.filter((i) => i.usable).map((item) => (
                            <button key={item.id} style={{ ...actionBtn, opacity: isPlayerTurn ? 1 : 0.4 }} onClick={() => handleUseItem(item)} disabled={!isPlayerTurn}>
                                {item.icon} {item.name}
                                <span style={{ fontSize: 9, color: "#888", marginLeft: 4 }}>x{item.quantity}</span>
                            </button>
                        ))}
                        {items.filter((i) => i.usable).length === 0 && (
                            <span style={{ fontSize: 10, color: "#444", fontStyle: "italic" }}>Sin items usables.</span>
                        )}
                    </div>
                </div>

                {/* Other */}
                <div>
                    <div style={subLabel}>OTROS</div>
                    <button style={{ ...actionBtn, color: "#E24B4A", borderColor: "#E24B4A44", opacity: isPlayerTurn ? 1 : 0.4 }} onClick={handleFlee} disabled={!isPlayerTurn}>
                        ↩ Huir
                    </button>
                </div>
            </div>
        </div>
    );
}

const enemiesPanel: React.CSSProperties = { background: "#1a1a2e", border: "1px solid #2a1a1a", borderRadius: 8, padding: 12 };
const enemyCard: React.CSSProperties = { background: "#12122a", borderRadius: 8, padding: 10 };
const targetBadge: React.CSSProperties = { position: "absolute", top: -8, left: 8, fontSize: 8, color: "#c9a84c", background: "#1a1a2e", padding: "1px 5px", borderRadius: 4, letterSpacing: 1 };
const section: React.CSSProperties = { background: "#1a1a2e", border: "1px solid #222", borderRadius: 8, padding: 12 };
const sectionTitle: React.CSSProperties = { fontSize: 11, letterSpacing: 1.5, color: "#c9a84c", marginBottom: 10 };
const subLabel: React.CSSProperties = { fontSize: 10, color: "#555", letterSpacing: 1.5, marginBottom: 6, fontWeight: "bold" as const };
const spellBtn: React.CSSProperties = { background: "#12122a", borderRadius: 6, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5, color: "#ccc", fontFamily: "Georgia, serif", cursor: "pointer" };
const actionBtn: React.CSSProperties = { background: "#12122a", border: "1px solid #2a2a4a", borderRadius: 6, padding: "7px 12px", color: "#ccc", cursor: "pointer", fontSize: 11, fontFamily: "Georgia, serif" };