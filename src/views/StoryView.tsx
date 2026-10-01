import { smallBtn } from "../App";
import { EventCard } from "../components/EventCard"
import { CHAPTERS } from "../data/events"
import type { GameState, StoryOption } from "../types/game-state"
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { getSpellById } from "../data/spells";
import { ALL_ITEMS } from "../data/items";
import { getEnemy } from "../data/enemies";
import { initCombat } from "../utils/combat";
import type { View } from "../types/view.type";

const MySwal = withReactContent(Swal);

type props = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    setView: (view: View) => void;

    handleBackToHub: () => void;
}

export default function StoryView({ state, setState, setView, handleBackToHub }: props) {
    const chapter = CHAPTERS.find(c => c.id === state.narrative.chapterId);
    if (!chapter) {
        return <div>Error: Capítulo no encontrado.</div>;
    }
    const node = chapter.nodes[state.narrative.nodeId];
    if (!node) {
        return <div>Error: Nodo de historia no encontrado.</div>;
    }

    function processEffectsAndAdvance(option?: StoryOption, nextId?: string, returnToHub?: boolean, triggerEnemyId?: string, nextChapterId?: string) {
        let ns = { ...state };

        const effect = option?.effect;
        if (effect) {
            if (effect.corruption) {
                ns.player.stats = { ...ns.player.stats, corruption: Math.min(100, Math.max(0, ns.player.stats.corruption + effect.corruption)) };
            }
            if (effect.sanity) {
                ns.player.stats = { ...ns.player.stats, sanity: Math.min(100, Math.max(0, ns.player.stats.sanity + effect.sanity)) };
            }
            if (effect.stability) {
                ns.player.stats = { ...ns.player.stats, stability: Math.min(100, Math.max(0, ns.player.stats.stability + effect.stability)) };
            }
            if (effect.hpChange) {
                ns.player.stats = { ...ns.player.stats, hp: Math.min(ns.player.stats.maxHp, Math.max(0, ns.player.stats.hp + effect.hpChange)) };
            }
            if (effect.manaChange) {
                ns.player.mana = { ...ns.player.mana, mana: Math.min(ns.player.mana.maxMana, Math.max(0, ns.player.mana.mana + effect.manaChange)) };
            }
            if (effect.physical_strength) {
                ns.player.stats = { ...ns.player.stats, physical_strength: ns.player.stats.physical_strength + effect.physical_strength };
            }
            if (effect.magical_strength) {
                ns.player.stats = { ...ns.player.stats, magical_strength: ns.player.stats.magical_strength + effect.magical_strength };
            }
            if (effect.speed) {
                ns.player.stats = { ...ns.player.stats, speed: ns.player.stats.speed + effect.speed };
            }
            if (effect.resistance) {
                ns.player.stats = { ...ns.player.stats, resistance: ns.player.stats.resistance + effect.resistance };
            }
            if (effect.magicResistance) {
                ns.player.stats = { ...ns.player.stats, magicResistance: ns.player.stats.magicResistance + effect.magicResistance };
            }
            if (effect.celestial) {
                ns.player.mana = { ...ns.player.mana, celestial: Math.min(ns.player.mana.maxCelestial, Math.max(0, ns.player.mana.celestial + effect.celestial)) };
            }
            if (effect.infernal) {
                ns.player.mana = { ...ns.player.mana, infernal: Math.min(ns.player.mana.maxInfernal, Math.max(0, ns.player.mana.infernal + effect.infernal)) };
            }
            if (effect.gainSpellId) {
                const spell = getSpellById(effect.gainSpellId);
                if (spell && !ns.player.spells.find((s) => s.id === spell.id)) ns.player.spells = [...ns.player.spells, spell];
            }
            if (effect.gainItemId) {
                const existing = ns.player.items.find((i) => i.id === effect.gainItemId);
                if (existing) {
                    ns.player.items = ns.player.items.map((i) => i.id === effect.gainItemId ? { ...i, quantity: i.quantity + 1 } : i);
                } else {
                    const item = ALL_ITEMS[effect.gainItemId];
                    if (item) ns.player.items = [...ns.player.items, { ...item, quantity: 1 }];
                }
            }
            if (effect.gainItemId2) {
                const existing2 = ns.player.items.find((i) => i.id === effect.gainItemId2);
                if (existing2) {
                    ns.player.items = ns.player.items.map((i) => i.id === effect.gainItemId2 ? { ...i, quantity: i.quantity + 1 } : i);
                } else {
                    const item2 = ALL_ITEMS[effect.gainItemId2];
                    if (item2) ns.player.items = [...ns.player.items, { ...item2, quantity: 1 }];
                }
            }
        }

        if (option) {
            ns.narrative.narrativeLog = [...ns.narrative.narrativeLog, `[${chapter!.title}] ${option.text}`];
        }

        if (nextChapterId) {
            // Find the new chapter and reset nodeId to its startNodeId
            const newChapter = CHAPTERS.find((c) => c.id === nextChapterId);
            const newNodeId = newChapter?.startNodeId ?? "wake_up";
            ns.narrative = {
                ...ns.narrative,
                chapterId: nextChapterId,
                nodeId: newNodeId,
            };
            // Reset map for the new chapter
            ns.mapState = undefined;
        }

        if (triggerEnemyId) {
            const enemy = getEnemy(triggerEnemyId);
            ns.narrative = { ...ns.narrative, nodeId: nextId ?? ns.narrative.nodeId };
            ns.combat = initCombat([enemy!]);
            setState(ns);
            setView("combat");
            return;
        }

        if (nextId && !nextChapterId) {
            ns.narrative = { ...ns.narrative, nodeId: nextId };
        }

        setState(ns);

        if (returnToHub) {
            setView("hub");
        }
    }

    function handleChoice(option: StoryOption) {
        if (option.consequence || option.effect) {
            let htmlContent = "<div style='text-align: left; font-size: 14px; margin-bottom: 15px;'><i>" + (option.consequence ?? "...") + "</i></div>";
            const effect = option?.effect;
            if (effect) {
                htmlContent += "<div style='text-align: left; font-size: 14px;'>";
                if (effect.hpChange) htmlContent += "<div style='color: " + (effect.hpChange > 0 ? "#1D9E75" : "#E24B4A") + "'><b>HP:</b> " + (effect.hpChange > 0 ? "+" : "") + effect.hpChange + "</div>";
                if (effect.manaChange) htmlContent += "<div style='color: " + (effect.manaChange > 0 ? "#378ADD" : "#E24B4A") + "'><b>Maná:</b> " + (effect.manaChange > 0 ? "+" : "") + effect.manaChange + "</div>";
                if (effect.physical_strength) htmlContent += "<div style='color: #c9a84c'><b>Fuerza Física:</b> " + (effect.physical_strength > 0 ? "+" : "") + effect.physical_strength + "</div>";
                if (effect.magical_strength) htmlContent += "<div style='color: #c9a84c'><b>Fuerza Mágica:</b> " + (effect.magical_strength > 0 ? "+" : "") + effect.magical_strength + "</div>";
                if (effect.corruption) htmlContent += "<div style='color: #9A63D4'><b>Corrupción:</b> " + (effect.corruption > 0 ? "+" : "") + effect.corruption + "</div>";
                if (effect.sanity) htmlContent += "<div style='color: #9A63D4'><b>Cordura:</b> " + (effect.sanity > 0 ? "+" : "") + effect.sanity + "</div>";
                if (effect.stability) htmlContent += "<div style='color: #9A63D4'><b>Estabilidad:</b> " + (effect.stability > 0 ? "+" : "") + effect.stability + "</div>";
                if (effect.gainItemId) htmlContent += "<div style='color: #e8e8e8'><b>Obtienes:</b> " + ALL_ITEMS[effect.gainItemId]?.name + "</div>";
                if (effect.gainItemId2) htmlContent += "<div style='color: #e8e8e8'><b>Obtienes:</b> " + ALL_ITEMS[effect.gainItemId2]?.name + "</div>";
                if (effect.gainSpellId) htmlContent += "<div style='color: #e8e8e8'><b>Aprendes:</b> " + getSpellById(effect.gainSpellId)?.name + "</div>";
                htmlContent += "</div>";
            }

            MySwal.fire({
                title: "<span style='color: #c9a84c; font-family: Georgia, serif'>Consecuencia</span>",
                html: htmlContent,
                background: "#1a1a2e",
                color: "#eee",
                confirmButtonColor: "#2a2a4a",
                confirmButtonText: "Continuar",
                customClass: { popup: "swal-custom-border" }
            }).then(() => {
                processEffectsAndAdvance(option, option.nextNodeId, option.returnToHub, option.triggerEnemyId, option.nextChapterId);
            });
        } else {
            processEffectsAndAdvance(option, option.nextNodeId, option.returnToHub, option.triggerEnemyId, option.nextChapterId);
        }
    }

    function handleContinue() {
        processEffectsAndAdvance(undefined, node.nextNodeId, node.returnToHub, node.triggerEnemyId, node.nextChapterId);
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>📜</span>
                <h2 style={{ color: "#c9a84c", margin: 0, fontSize: 16 }}>{chapter.title}</h2>
            </div>
            <EventCard node={node} onChoice={handleChoice} onContinue={handleContinue} />
            <button onClick={handleBackToHub} style={{ ...smallBtn, marginTop: 16, marginLeft: 0 }}>â† Volver al Hub (Pausa)</button>
        </div>
    )
}


