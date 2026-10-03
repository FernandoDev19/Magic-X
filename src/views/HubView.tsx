import { getEnemy } from "../data/enemies";
import type { GameState } from "../types/game-state";
import type { View } from "../types/view.type";
import { initCombat } from "../utils/combat";
import { ENCOUNTERS_BY_CHAPTER } from "./CombatView";

type props = {
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  setExploreEvent?: (event: any) => void;
  setView: (view: View) => void;
  setShopMessage: (message: string | null) => void;
  chapterId: string;
  chapterTitle: string;
  onResumeScene?: () => void;
};

export default function HubView({
  setState,
  setView,
  setShopMessage,
  chapterId,
  chapterTitle,
  onResumeScene,
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
    const pool = ENCOUNTERS_BY_CHAPTER[chapterId] ?? ENCOUNTERS_BY_CHAPTER.ch1;
    const maxCount = chapterId === "ch1" ? 2 : 3;
    const count = Math.floor(Math.random() * maxCount) + 1;
    const enemies = Array.from({ length: count }, () =>
      getEnemy(pool[Math.floor(Math.random() * pool.length)]),
    );
    setState((s) => ({ ...s, combat: initCombat(enemies), returnTo: "hub" }));
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

      {onResumeScene && (
        <button
          onClick={onResumeScene}
          style={{ ...hubStoryButton, marginBottom: 12 }}
        >
          <span style={{ fontSize: 20 }}>🎭</span>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>
            Continuar escena en curso
          </div>
        </button>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        <button onClick={handleExplore} style={hubMainButton}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🗺️</div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>Mapa de Viaje</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
            Nodos interactivos
          </div>
        </button>

        <button onClick={handleCombat} style={hubMainButton}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>⚔️</div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>Combatir</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
            Enemigos del capítulo
          </div>
        </button>

        <button onClick={() => setView("party")} style={hubMainButton}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>👥</div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>Compañeros</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
            Gestión de equipo
          </div>
        </button>

        <button onClick={handleShop} style={hubMainButton}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🛒</div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>Tienda</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
            Gasta oro
          </div>
        </button>

        <button onClick={handleInventory} style={hubMainButton}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🎒</div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>Inventario</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
            Tus objetos
          </div>
        </button>

        <button onClick={handleEquipment} style={hubMainButton}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🛡️</div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>Equipamiento</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
            Armas, armadura y accesorios
          </div>
        </button>

        <button onClick={() => setView("quests")} style={hubMainButton}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>📋</div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>Misiones</div>
          <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
            Diario de misiones
          </div>
        </button>

        <button onClick={handleGrimoire} style={hubMainButton}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>📖</div>
          <div style={{ fontSize: 13, fontWeight: "bold" }}>Grimorio</div>
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
            <div style={{ fontSize: 10, color: "#888" }}>{chapterTitle}</div>
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
