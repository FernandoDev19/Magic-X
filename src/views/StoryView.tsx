import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { smallBtn } from "../App";
import { EventCard } from "../components/EventCard";
import { CHAPTERS } from "../data/events";
import { SCENES } from "../data/scenes";
import { ALL_ITEMS } from "../data/items";
import { getSpellById } from "../data/spells";
import { getEnemy } from "../data/enemies";
import { initCombat } from "../utils/combat";
import { applyStep, resolveNode } from "../utils/story";
import { announceLevelUps } from "../utils/level-up-ui";
import type { GameState, StoryOption } from "../types/game-state";
import type { View } from "../types/view.type";

const MySwal = withReactContent(Swal);

type Props = {
  mode: "chapter" | "scene";
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  setView: (view: View) => void;
  setGameOver: (v: boolean) => void;
  handleBackToHub: () => void;
};

export default function StoryView({
  mode,
  state,
  setState,
  setView,
  setGameOver,
  handleBackToHub,
}: Props) {
  const isScene = mode === "scene";
  const chapter = isScene
    ? state.scene
      ? SCENES[state.scene.sceneId]
      : undefined
    : CHAPTERS.find((c) => c.id === state.narrative.chapterId);
  const nodeId = isScene ? state.scene?.nodeId : state.narrative.nodeId;
  const rawNode = chapter && nodeId ? chapter.nodes[nodeId] : undefined;

  if (!chapter || !rawNode) {
    return (
      <div>
        <div>Error: no se encontró el nodo de historia.</div>
        <button
          style={{ ...smallBtn, marginTop: 12, marginLeft: 0 }}
          onClick={() => {
            setState((s) => ({ ...s, scene: null }));
            setView("hub");
          }}
        >
          ← Volver al Hub
        </button>
      </div>
    );
  }

  const node = resolveNode(rawNode, state);
  const locked = !!node.gate && !state.flags?.[node.gate.flag];

  function advance(option?: StoryOption) {
    const src = option ?? rawNode!;
    const { state: s1, levelUps } = applyStep(
      state,
      rawNode!,
      option,
      chapter!.title,
    );
    let ns: GameState = s1;
    const nextId = src.nextNodeId;

    if (src.nextChapterId) {
      const next = CHAPTERS.find((c) => c.id === src.nextChapterId);
      ns = {
        ...ns,
        narrative: {
          ...ns.narrative,
          chapterId: src.nextChapterId,
          nodeId: next?.startNodeId ?? ns.narrative.nodeId,
        },
        mapState: undefined,
      };
    } else if (nextId) {
      ns = isScene
        ? { ...ns, scene: { sceneId: state.scene!.sceneId, nodeId: nextId } }
        : { ...ns, narrative: { ...ns.narrative, nodeId: nextId } };
    }

    if (src.triggerEnemyId) {
      ns = {
        ...ns,
        combat: initCombat([getEnemy(src.triggerEnemyId)]),
        returnTo: isScene ? "scene" : "story",
      };
      setState(ns);
      setView("combat");
      if (levelUps.length) announceLevelUps(levelUps, setState);
      return;
    }

    const finished = !nextId && !src.nextChapterId;
    if (isScene && finished) ns = { ...ns, scene: null };

    setState(ns);
    if (levelUps.length) announceLevelUps(levelUps, setState);
    if (src.endGame) setGameOver(true);
    if (src.returnToHub) setView("hub");
    else if (isScene && finished) setView("explore");
  }

  function consequenceHtml(o: StoryOption) {
    const e = o.effect;
    const row = (color: string, label: string, v: number) =>
      `<div style="color:${color}"><b>${label}:</b> ${v > 0 ? "+" : ""}${v}</div>`;
    let h = `<div style="text-align:left;font-size:14px;margin-bottom:12px"><i>${o.consequence ?? "..."}</i></div>`;
    if (e) {
      h += `<div style="text-align:left;font-size:14px">`;
      if (e.hpChange)
        h += row(e.hpChange > 0 ? "#1D9E75" : "#E24B4A", "PV", e.hpChange);
      if (e.manaChange) h += row("#378ADD", "Maná", e.manaChange);
      if (e.celestial) h += row("#FAC775", "Celestial", e.celestial);
      if (e.infernal) h += row("#7F77DD", "Infernal", e.infernal);
      if (e.physical_strength)
        h += row("#c9a84c", "Fuerza física", e.physical_strength);
      if (e.magical_strength)
        h += row("#c9a84c", "Fuerza mágica", e.magical_strength);
      if (e.corruption) h += row("#9A63D4", "Corrupción", e.corruption);
      if (e.sanity) h += row("#9A63D4", "Cordura", e.sanity);
      if (e.stability) h += row("#9A63D4", "Estabilidad", e.stability);
      if (e.xp) h += row("#c9a84c", "XP", e.xp);
      if (e.gainItemId)
        h += `<div><b>Obtienes:</b> ${ALL_ITEMS[e.gainItemId]?.name}</div>`;
      if (e.gainItemId2)
        h += `<div><b>Obtienes:</b> ${ALL_ITEMS[e.gainItemId2]?.name}</div>`;
      if (e.gainSpellId)
        h += `<div><b>Aprendes:</b> ${getSpellById(e.gainSpellId)?.name}</div>`;
      h += `</div>`;
    }
    return h;
  }

  function handleChoice(option: StoryOption) {
    if (!option.consequence && !option.effect) return advance(option);
    MySwal.fire({
      title:
        "<span style='color:#c9a84c;font-family:Georgia,serif'>Consecuencia</span>",
      html: consequenceHtml(option),
      background: "#1a1a2e",
      color: "#eee",
      confirmButtonColor: "#2a2a4a",
      confirmButtonText: "Continuar",
    }).then(() => advance(option));
  }

  const bgKey = rawNode.bg ?? (isScene ? state.scene!.sceneId : chapter.id);
  const partyNames = (state.player.party ?? [])
    .filter((c) => c.isRecruited && c.isActive)
    .slice(0, 2)
    .map((c) => c.name);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 20 }}>{isScene ? "🎭" : "📜"}</span>
        <h2 style={{ color: "#c9a84c", margin: 0, fontSize: 16 }}>
          {chapter.title}
        </h2>
      </div>

      {locked ? (
        <div style={lockedCard}>
          <p
            style={{
              color: "#ccc",
              lineHeight: 1.7,
              fontStyle: "italic",
              margin: "0 0 16px",
            }}
          >
            {node.gate!.text}
          </p>
          <button style={mapBtn} onClick={() => setView("explore")}>
            🗺️ Ir al Mapa de Viaje
          </button>
        </div>
      ) : (
        <EventCard
          key={`${isScene ? state.scene!.sceneId : chapter.id}:${rawNode.id}`}
          node={node}
          bgKey={bgKey}
          partyNames={partyNames}
          onChoice={handleChoice}
          onContinue={() => advance()}
        />
      )}

      <button
        onClick={handleBackToHub}
        style={{ ...smallBtn, marginTop: 16, marginLeft: 0 }}
      >
        ← Volver al Hub (Pausa)
      </button>
    </div>
  );
}

const lockedCard: React.CSSProperties = {
  background: "#1a1a2e",
  border: "1px solid #c9a84c55",
  borderRadius: 8,
  padding: 24,
  maxWidth: 640,
  margin: "0 auto",
};
const mapBtn: React.CSSProperties = {
  background: "#c9a84c",
  color: "#000",
  border: "none",
  borderRadius: 6,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "0.9rem",
};
