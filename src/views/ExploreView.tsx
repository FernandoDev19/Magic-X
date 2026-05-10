import { smallBtn } from "../App";
import type { GameState, NarrativeEffect } from "../types/game-state";
import { hubButton, hubCard } from "./HubView";
import { getSpellById } from "../data/spells";
import { ALL_ITEMS } from "../data/items";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";

export interface ExploreEvent {
    id: string;
    title: string;
    description: string;
    options: {
        text: string;
        effect: NarrativeEffect;
        consequence: string;
    }[];
}

export const EXPLORE_EVENTS: ExploreEvent[] = [
    {
        id: "exp1",
        title: "Ruinas Antiguas",
        description:
            "Descubres ruinas cubiertas de musgo. Las inscripciones hablan de un dios olvidado.",
        options: [
            {
                text: "Investigar",
                effect: { manaChange: -10, gainItemId: "ancient_tome" },
                consequence:
                    "Encuentras un Tomo Ancestral con conocimiento perdido.",
            },
            {
                text: "Buscar tesoros",
                effect: { corruption: +5, gainItemId: "dark_essence" },
                consequence:
                    "Encuentras Esencia Oscura, pero sientes algo oscuro.",
            },
            {
                text: "Ignorar",
                effect: { hpChange: +5 },
                consequence: "Decides no arriesgarte y descansas un poco.",
            },
        ],
    },
    {
        id: "exp2",
        title: "Mercader Errante",
        description:
            "Un mercader con capa colorida te ofrece intercambiar bienes.",
        options: [
            {
                text: "Comprar poción",
                effect: { manaChange: -20, gainItemId: "hp_potion" },
                consequence: "Obtienes una Poción de PV a cambio de maná.",
            },
            {
                text: "Vender recursos",
                effect: { manaChange: +30, hpChange: -10 },
                consequence: "Vendes algo de tu esencia vital por maná.",
            },
            {
                text: "Ignorar",
                effect: {},
                consequence: "El mercader se aleja murmurando.",
            },
        ],
    },
    {
        id: "exp3",
        title: "Círculo de Piedras",
        description:
            "Un círculo de piedras brilla débilmente con energía mágica.",
        options: [
            {
                text: "Meditar",
                effect: { manaChange: +40, celestial: +20 },
                consequence: "La energía del lugar fluye hacia ti.",
            },
            {
                text: "Romper el círculo",
                effect: { corruption: +10, infernal: +30 },
                consequence: "Liberas energía oscura contenida.",
            },
            {
                text: "Marcharse",
                effect: {},
                consequence: "Algo te dice que no es buena idea quedarse.",
            },
        ],
    },
    {
        id: "exp4",
        title: "Refugiado Herido",
        description: "Un viajero herido pide ayuda junto al camino.",
        options: [
            {
                text: "Curar con magia",
                effect: { manaChange: -25, corruption: -10 },
                consequence: "Tu bondad purifica un poco tu alma.",
            },
            {
                text: "Robarle",
                effect: { corruption: +15, gainItemId: "hp_potion" },
                consequence: "Obtienes una poción, pero a qué costo...",
            },
            {
                text: "Pasar de largo",
                effect: {},
                consequence: "No es tu problema.",
            },
        ],
    },
    {
        id: "exp5",
        title: "Cueva Misteriosa",
        description: "Una cueva oscura emana frialdad sobrenatural.",
        options: [
            {
                text: "Entrar",
                effect: { hpChange: -20, gainItemId: "crystal_orb" },
                consequence:
                    "Algo te ataca en la oscuridad, pero encuentras un Orbe.",
            },
            {
                text: "Espiar desde fuera",
                effect: { manaChange: -15, gainSpellId: "shadow_manipulation" },
                consequence: "Observas sombras vivas y aprendes su naturaleza.",
            },
            {
                text: "Evitar",
                effect: {},
                consequence: "Las cuevas oscuras son mala idea.",
            },
        ],
    },
];

const MySwal = withReactContent(Swal);

type Props = {
    exploreEvent: ExploreEvent | null;
    state: GameState;
    setState: (s: GameState) => void;
    onBackToHub: () => void;
};

export default function ExploreView({
    state,
    setState,
    onBackToHub,
    exploreEvent,
}: Props) {
    // Explore Event Handler
    function handleExploreChoice(optionIndex: number) {
        if (!exploreEvent) return;
        const option = exploreEvent.options[optionIndex];
        let ns = { ...state };

        if (option.effect.corruption) {
            ns.player.stats = {
                ...ns.player.stats,
                corruption: Math.min(
                    100,
                    Math.max(
                        0,
                        ns.player.stats.corruption + option.effect.corruption,
                    ),
                ),
            };
        }
        if (option.effect.hpChange) {
            ns.player.stats = {
                ...ns.player.stats,
                hp: Math.min(
                    ns.player.stats.maxHp,
                    Math.max(0, ns.player.stats.hp + option.effect.hpChange),
                ),
            };
        }
        if (option.effect.manaChange) {
            ns.player.mana = {
                ...ns.player.mana,
                mana: Math.min(
                    ns.player.mana.maxMana,
                    Math.max(0, ns.player.mana.mana + option.effect.manaChange),
                ),
            };
        }
        if (option.effect.physical_strength) {
            ns.player.stats = {
                ...ns.player.stats,
                physical_strength:
                    ns.player.stats.physical_strength +
                    option.effect.physical_strength,
            };
        }
        if (option.effect.magical_strength) {
            ns.player.stats = {
                ...ns.player.stats,
                magical_strength:
                    ns.player.stats.magical_strength +
                    option.effect.magical_strength,
            };
        }
        if (option.effect.speed) {
            ns.player.stats = {
                ...ns.player.stats,
                speed: ns.player.stats.speed + option.effect.speed,
            };
        }
        if (option.effect.resistance) {
            ns.player.stats = {
                ...ns.player.stats,
                resistance:
                    ns.player.stats.resistance + option.effect.resistance,
            };
        }
        if (option.effect.magicResistance) {
            ns.player.stats = {
                ...ns.player.stats,
                magicResistance:
                    ns.player.stats.magicResistance +
                    option.effect.magicResistance,
            };
        }
        if (option.effect.celestial) {
            ns.player.mana = {
                ...ns.player.mana,
                celestial: Math.min(
                    ns.player.mana.maxCelestial,
                    Math.max(
                        0,
                        ns.player.mana.celestial + option.effect.celestial,
                    ),
                ),
            };
        }
        if (option.effect.infernal) {
            ns.player.mana = {
                ...ns.player.mana,
                infernal: Math.min(
                    ns.player.mana.maxInfernal,
                    Math.max(
                        0,
                        ns.player.mana.infernal + option.effect.infernal,
                    ),
                ),
            };
        }
        if (option.effect.gainSpellId) {
            const spell = getSpellById(option.effect.gainSpellId);
            if (spell && !ns.player.spells.find((s) => s.id === spell.id))
                ns.player.spells = [...ns.player.spells, spell];
        }
        if (option.effect.gainItemId) {
            const existing = ns.player.items.find(
                (i) => i.id === option.effect.gainItemId,
            );
            if (existing) {
                ns.player.items = ns.player.items.map((i) =>
                    i.id === option.effect.gainItemId
                        ? { ...i, quantity: i.quantity + 1 }
                        : i,
                );
            } else {
                const item = ALL_ITEMS[option.effect.gainItemId];
                if (item)
                    ns.player.items = [
                        ...ns.player.items,
                        { ...item, quantity: 1 },
                    ];
            }
        }
        if (option.effect.gainItemId2) {
            const existing = ns.player.items.find(
                (i) => i.id === option.effect.gainItemId2,
            );
            if (existing) {
                ns.player.items = ns.player.items.map((i) =>
                    i.id === option.effect.gainItemId2
                        ? { ...i, quantity: i.quantity + 1 }
                        : i,
                );
            } else {
                const item = ALL_ITEMS[option.effect.gainItemId2];
                if (item)
                    ns.player.items = [
                        ...ns.player.items,
                        { ...item, quantity: 1 },
                    ];
            }
        }

        ns.narrative.narrativeLog = [
            ...ns.narrative.narrativeLog,
            `[${exploreEvent.title}] ${option.text}`,
        ];
        setState(ns);

        // Mostrar consecuencia y volver al hub
        MySwal.fire({
            title: '<span style="color: #c9a84c; font-family: Georgia, serif">Resultado</span>',
            html: `<div style="text-align: left; font-size: 14px;"><i>"${option.consequence}"</i></div>`,
            background: "#1a1a2e",
            color: "#eee",
            confirmButtonColor: "#2a2a4a",
            confirmButtonText: "Volver al Hub",
            customClass: { popup: "swal-custom-border" },
        }).then(() => {
            onBackToHub();
        });
    }

    return (
        <div style={hubCard}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                }}
            >
                <span style={{ fontSize: 20 }}>🗺️</span>
                <h2 style={{ color: "#c9a84c", margin: 0, fontSize: 16 }}>
                    Explorando: {exploreEvent.title}
                </h2>
            </div>
            <p
                style={{
                    color: "#ccc",
                    fontSize: 13,
                    lineHeight: 1.6,
                    marginBottom: 16,
                }}
            >
                {exploreEvent.description}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {exploreEvent.options.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleExploreChoice(idx)}
                        style={hubButton}
                    >
                        {opt.text}
                    </button>
                ))}
            </div>
            <button
                onClick={onBackToHub}
                style={{ ...smallBtn, marginTop: 16, marginLeft: 0 }}
            >
                ← Volver al Hub
            </button>
        </div>
    );
}
