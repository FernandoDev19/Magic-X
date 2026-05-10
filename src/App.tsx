import { useState, useEffect } from "react";
import { CHAPTERS } from "./data/events";
import { ALL_SPELLS, getSpellById } from "./data/spells";
import { buildInventory, ALL_ITEMS } from "./data/items";
import { getEquipment } from "./data/equipment";
import { PLAYER_PROFILE } from "./data/player";
import { StatsPanel } from "./components/StatsPanel";
import { CombatView } from "./views/CombatView";
import { emptyGear, equipItem } from "./utils/equipment";
import StoryView from "./views/StoryView";
import InventoryView from "./views/InventoryView";
import EquipmentView from "./views/EquipmentView";
import ShopView from "./views/ShopView";
import ExploreView, { type ExploreEvent } from "./views/ExploreView";
import HubView from "./views/HubView";
import { getEnding } from "./utils/get-ending";
import GrimoireView from "./views/GrimoireView";
import type { GameState } from "./types/game-state";
import type { EquippedGear } from "./types/equipment.type";
import { getSkillById } from "./data/skills";
import type { View } from "./types/view.type";

const STORAGE_KEY = "magicx_v3";

function buildStartingEquipment(): EquippedGear {
    let gear = emptyGear();
    const startingIds = PLAYER_PROFILE.startingEquipmentIds ?? [];
    for (const { id, slot } of startingIds) {
        const item = getEquipment(id);
        if (item) {
            const result = equipItem(gear, item, slot);
            gear = result.newGear;
        }
    }
    return gear;
}

function buildInitialState(): GameState {
    const p = PLAYER_PROFILE;
    return {
        player: {
            stats: { ...p.baseStats },
            mana: { ...p.baseMana },
            type: p.type,
            elementLevels: { ...p.elementLevels },
            elementAffinity: { ...p.elementAffinity },
            spells: p.startingSpellIds
                .map((id) => getSpellById(id)!)
                .filter(Boolean),
            items: buildInventory(p.startingItemIds),
            equipment: buildStartingEquipment(),
            statusEffects: [],
            skills: p.startingSkillIds
                .map((id) => getSkillById(id)!)
                .filter(Boolean),
            xp: 0,
        },
        combat: {
            active: false,
            enemies: [],
            selectedEnemyIndex: 0,
            turn: "player",
            round: 1,
            log: [],
            comboSlot: [],
        },
        narrative: {
            chapterId: CHAPTERS[0].id,
            nodeId: CHAPTERS[0].startNodeId,
            narrativeLog: [],
        },
    };
}

export default function App() {
    // States
    const [state, setState] = useState<GameState>(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : buildInitialState();
        } catch {
            return buildInitialState();
        }
    });
    const [exploreEvent, setExploreEvent] = useState<ExploreEvent | null>(null);
    const [view, setView] = useState<View>("hub");
    const [gameOver, setGameOver] = useState(false);
    const [combatResult, setCombatResult] = useState<
        "victory" | "defeat" | null
    >(null);

    const [shopMessage, setShopMessage] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    function handleBackToHub() {
        setView("hub");
        setExploreEvent(null);
        setShopMessage(null);
        setCombatResult(null);
    }

    function handleContinueAfterCombat() {
        setCombatResult(null);
        setView("hub");
        setState({ ...state, combat: { ...state.combat, active: false } });
    }

    function handleRestart() {
        localStorage.removeItem(STORAGE_KEY);
        setState(buildInitialState());
        setGameOver(false);
        setCombatResult(null);
        setView("hub");
        setExploreEvent(null);
        setShopMessage(null);
    }

    return (
        <div style={page}>
            {/* Header */}
            <div
                style={{
                    maxWidth: 960,
                    margin: "0 auto",
                    position: "relative",
                    marginBottom: 20,
                }}
            >
                <h1 style={{ ...titleStyle, marginBottom: 0 }}>Magic X</h1>
                <button
                    onClick={handleRestart}
                    style={{
                        ...smallBtn,
                        position: "absolute",
                        right: 0,
                        top: 4,
                        color: "#888",
                        borderColor: "#333",
                    }}
                    title="Reiniciar aventura"
                >
                    Reiniciar
                </button>
            </div>

            <div style={layout}>
                {/* Left */}
                <div style={{ width: 210, flexShrink: 0 }}>
                    <StatsPanel
                        stats={state.player.stats}
                        mana={state.player.mana}
                        role={state.player.type}
                        statusEffects={state.player.statusEffects}
                        elementLevels={state.player.elementLevels}
                        elementAffinity={state.player.elementAffinity}
                        characterName={PLAYER_PROFILE.name}
                        xp={state.player.xp}
                        gold={
                            state.player.items.find((i) => i.id === "gold")
                                ?.quantity || 0
                        }
                    />
                </div>

                {/* Main */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {combatResult === "victory" && (
                        <div style={resultBox("#1D9E7522", "#1D9E75")}>
                            Victoria. El enemigo ha caído.
                            <button
                                style={smallBtn}
                                onClick={handleContinueAfterCombat}
                            >
                                Volver al Hub
                            </button>
                        </div>
                    )}

                    {gameOver ? (
                        <div style={endCard}>
                            <h2 style={{ color: "#c9a84c", marginBottom: 12 }}>
                                Fin del camino
                            </h2>
                            <p style={{ color: "#ccc" }}>
                                {state.player.stats.hp <= 0
                                    ? "CaÃ­ste en combate. El dios muere... por ahora."
                                    : getEnding(
                                          state.player.stats,
                                          state.player.xp,
                                      )}
                            </p>
                            <p
                                style={{
                                    color: "#666",
                                    fontSize: 11,
                                    marginTop: 8,
                                }}
                            >
                                XP total: {state.player.xp}
                            </p>
                            <button style={restartBtn} onClick={handleRestart}>
                                Renacer
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* HUB */}
                            {view === "hub" && (
                                <HubView
                                    setState={setState}
                                    setExploreEvent={setExploreEvent}
                                    setView={setView}
                                    setShopMessage={setShopMessage}
                                    chapterTitle={
                                        CHAPTERS.find(
                                            (c) =>
                                                c.id ===
                                                state.narrative.chapterId,
                                        )?.title ?? ""
                                    }
                                />
                            )}

                            {/* EXPLORE */}
                            {view === "explore" && exploreEvent && (
                                <ExploreView
                                    exploreEvent={exploreEvent}
                                    onBackToHub={handleBackToHub}
                                    state={state}
                                    setState={setState}
                                />
                            )}

                            {/* COMBAT */}
                            {view === "combat" && (
                                <CombatView
                                    skills={state.player.skills}
                                    combat={state.combat}
                                    spells={state.player.spells}
                                    items={state.player.items}
                                    stats={state.player.stats}
                                    mana={state.player.mana}
                                    setState={setState}
                                    state={state}
                                    setCombatResult={setCombatResult}
                                    setView={setView}
                                    setGameOver={setGameOver}
                                />
                            )}

                            {/* SHOP */}
                            {view === "shop" && (
                                <ShopView
                                    state={state}
                                    setState={setState}
                                    setShopMessage={setShopMessage}
                                    shopMessage={shopMessage}
                                    handleBackToHub={handleBackToHub}
                                />
                            )}

                            {/* INVENTORY */}
                            {view === "inventory" && (
                                <InventoryView
                                    state={state}
                                    handleBackToHub={handleBackToHub}
                                />
                            )}

                            {/* EQUIPMENT */}
                            {view === "equipment" && (
                                <EquipmentView
                                    state={state}
                                    setState={setState}
                                    handleBackToHub={handleBackToHub}
                                />
                            )}

                            {/* STORY */}
                            {view === "story" &&
                                !state.combat.active &&
                                CHAPTERS.some(
                                    (c) => c.id === state.narrative.chapterId,
                                ) && (
                                    <StoryView
                                        state={state}
                                        handleBackToHub={handleBackToHub}
                                        setState={setState}
                                        setView={setView}
                                    />
                                )}

                            {/* GRIMOIRE */}
                            {view === "grimoire" && (
                                <div>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            marginBottom: 12,
                                        }}
                                    >
                                        <span style={{ fontSize: 20 }}>📖</span>
                                        <h2
                                            style={{
                                                color: "#c9a84c",
                                                margin: 0,
                                                fontSize: 16,
                                            }}
                                        >
                                            Grimorio
                                        </h2>
                                        <button
                                            onClick={handleBackToHub}
                                            style={{
                                                ...smallBtn,
                                                marginLeft: 12,
                                            }}
                                        >
                                            Volver al Hub
                                        </button>
                                    </div>
                                    <GrimoireView
                                        playerSpells={state.player.spells}
                                        elementLevels={
                                            state.player.elementLevels
                                        }
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Styles
export const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0d0d1a",
    color: "#eee",
    fontFamily: "Georgia, serif",
    padding: "28px 16px",
};
export const titleStyle: React.CSSProperties = {
    textAlign: "center",
    color: "#c9a84c",
    letterSpacing: 4,
    marginBottom: 20,
    fontSize: "1.5rem",
};
export const layout: React.CSSProperties = {
    display: "flex",
    gap: 14,
    maxWidth: 960,
    margin: "0 auto",
    alignItems: "flex-start",
};
export const endCard: React.CSSProperties = {
    background: "#1a1a2e",
    border: "1px solid #444",
    borderRadius: 8,
    padding: 24,
};
export const restartBtn: React.CSSProperties = {
    marginTop: 14,
    background: "#c9a84c22",
    color: "#c9a84c",
    border: "1px solid #c9a84c",
    borderRadius: 6,
    padding: "7px 18px",
    cursor: "pointer",
    fontSize: 11,
};
export const smallBtn: React.CSSProperties = {
    marginLeft: 12,
    background: "transparent",
    color: "inherit",
    border: "1px solid currentColor",
    borderRadius: 5,
    padding: "3px 10px",
    cursor: "pointer",
    fontSize: 11,
};
export const gCard: React.CSSProperties = {
    background: "#1a1a2e",
    border: "1px solid #222",
    borderRadius: 8,
    padding: 12,
};
export const gTitle: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: 2,
    color: "#555",
    marginBottom: 10,
};
export const spellRow: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "5px 4px",
    borderBottom: "1px solid #12122a",
};
export const filterBtn: React.CSSProperties = {
    background: "#12122a",
    border: "1px solid #2a2a4a",
    borderRadius: 5,
    padding: "4px 10px",
    color: "#666",
    cursor: "pointer",
    fontSize: 10,
    fontFamily: "Georgia, serif",
};
export const filterActive: React.CSSProperties = {
    color: "#c9a84c",
    borderColor: "#c9a84c44",
};
export const resultBox = (bg: string, border: string): React.CSSProperties => ({
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 8,
    padding: "10px 14px",
    color: border,
    fontSize: 12,
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
});
