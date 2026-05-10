import { getEnemy } from "../data/enemies";
import type { GameState } from "../types/game-state";
import type { View } from "../types/view.type";
import { initCombat } from "../utils/combat";
import { COMBAT_ENEMIES } from "./CombatView";
import { EXPLORE_EVENTS, type ExploreEvent } from "./ExploreView";

type props = {
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    setExploreEvent: (event: ExploreEvent) => void;
    setView: (view: View) => void;
    setShopMessage: (message: string | null) => void;
    chapterTitle: string;
};

export default function HubView({
    setState,
    setExploreEvent,
    setView,
    setShopMessage,

    chapterTitle,
}: props) {
    function handleInventory() {
        setView("inventory");
    }

    function handleEquipment() {
        setView("equipment");
    }

    function handleStory() {
        setView("story");
    }

    function handleExplore() {
        const randomEvent =
            EXPLORE_EVENTS[Math.floor(Math.random() * EXPLORE_EVENTS.length)];
        setExploreEvent(randomEvent);
        setView("explore");
    }

    function handleShop() {
        setView("shop");
        setShopMessage(null);
    }

    function handleGrimoire() {
        setView("grimoire");
    }

    function handleCombat() {
        const count = Math.floor(Math.random() * 4) + 1; // 1-4 enemigos
        const enemies = Array.from({ length: count }, () => {
            const id =
                COMBAT_ENEMIES[
                    Math.floor(Math.random() * COMBAT_ENEMIES.length)
                ];
            return getEnemy(id);
        });
        setState((s) => ({ ...s, combat: initCombat(enemies) }));
        setView("combat");
    }

    return (
        <div style={hubCard}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
                <h2 style={{ color: "#c9a84c", margin: 0, fontSize: 18 }}>
                    ⚫ Santuario del Dios Caído
                </h2>
                <p style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                    Elige tu camino
                </p>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 12,
                }}
            >
                <button onClick={handleExplore} style={hubMainButton}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>🗺️</div>
                    <div style={{ fontSize: 13, fontWeight: "bold" }}>
                        Explorar
                    </div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                        Evento aleatorio
                    </div>
                </button>

                <button onClick={handleCombat} style={hubMainButton}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>⚔️</div>
                    <div style={{ fontSize: 13, fontWeight: "bold" }}>
                        Combatir
                    </div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                        Enemigo aleatorio
                    </div>
                </button>

                <button onClick={handleShop} style={hubMainButton}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>🛒</div>
                    <div style={{ fontSize: 13, fontWeight: "bold" }}>
                        Tienda
                    </div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                        Gasta oro
                    </div>
                </button>

                <button onClick={handleInventory} style={hubMainButton}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>🎒</div>
                    <div style={{ fontSize: 13, fontWeight: "bold" }}>
                        Inventario
                    </div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                        Tus objetos
                    </div>
                </button>

                <button onClick={handleEquipment} style={hubMainButton}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>⚔️</div>
                    <div style={{ fontSize: 13, fontWeight: "bold" }}>
                        Equipamiento
                    </div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                        Armas, armadura y accesorios
                    </div>
                </button>

                <button onClick={handleGrimoire} style={hubMainButton}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>📖</div>
                    <div style={{ fontSize: 13, fontWeight: "bold" }}>
                        Grimorio
                    </div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                        Hechizos aprendidos
                    </div>
                </button>
            </div>

            {/* historia */}
            <div
                style={{
                    marginTop: 16,
                    borderTop: "1px solid #2a2a4a",
                    paddingTop: 16,
                }}
            >
                <button onClick={handleStory} style={hubStoryButton}>
                    <span style={{ fontSize: 20 }}>📜</span>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: "bold" }}>
                            Historia Principal
                        </div>
                        <div style={{ fontSize: 10, color: "#888" }}>
                            {chapterTitle}
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}

export const hubCard: React.CSSProperties = {
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: 12,
    padding: 20,
};
export const hubMainButton: React.CSSProperties = {
    background: "#12122a",
    border: "1px solid #2a2a4a",
    borderRadius: 10,
    padding: 16,
    color: "#ccc",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "all 0.2s",
    fontFamily: "Georgia, serif",
};
export const hubStoryButton: React.CSSProperties = {
    background: "#1e1e3a",
    border: "1px solid #c9a84c55",
    borderRadius: 10,
    padding: 12,
    color: "#c9a84c",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    fontFamily: "Georgia, serif",
};
export const hubButton: React.CSSProperties = {
    background: "#12122a",
    border: "1px solid #2a2a4a",
    borderRadius: 6,
    padding: "10px 14px",
    color: "#ccc",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "Georgia, serif",
    fontSize: 12,
};
export const shopItemBtn: React.CSSProperties = {
    background: "#12122a",
    border: "1px solid #2a2a4a",
    borderRadius: 6,
    padding: 10,
    color: "#ccc",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    fontFamily: "Georgia, serif",
};
