import Swal from "sweetalert2";
import type { GameState } from "../types/game-state";
import type { MagicElement } from "../types/magic-element.type";
import type { LevelUpInfo } from "./leveling";

const ELEMENT_OPTIONS: Record<MagicElement, string> = {
    fire: "🔥 Fuego", earth: "🪨 Tierra", water: "💧 Agua", air: "🌪 Aire",
    light: "✨ Luz", darkness: "🌑 Oscuridad", electric: "⚡ Rayo", vital: "💛 E. Vital",
};

export async function announceLevelUps(
    levelUps: LevelUpInfo[],
    setState: React.Dispatch<React.SetStateAction<GameState>>,
) {
    for (const lu of levelUps) {
        const gains = lu.gains.map((g) => `<div>+${g.value} ${g.label}</div>`).join("");
        const unlocks = [
            ...lu.newSkills.map((n) => `<div style="color:#c9a84c">⚔ Nueva habilidad: <b>${n}</b></div>`),
            ...lu.newSpells.map((n) => `<div style="color:#7F77DD">📖 Nuevo hechizo: <b>${n}</b></div>`),
        ].join("");

        const res = await Swal.fire({
            title: `<span style="color:#c9a84c">⭐ ¡Nivel ${lu.level}!</span>`,
            html: `<div style="text-align:left;font-size:13px;line-height:1.6;color:#5DCAA5">${gains}</div>
                   <div style="text-align:left;font-size:13px;margin-top:8px">${unlocks}</div>`,
            input: "select",
            inputOptions: ELEMENT_OPTIONS,
            inputValue: "fire",
            inputLabel: "Elige un elemento para +1 de nivel de magia",
            confirmButtonText: "Aumentar",
            allowOutsideClick: false,
            background: "#1a1a2e",
            color: "#eee",
            confirmButtonColor: "#c9a84c",
        });

        const el = res.value as MagicElement | undefined;
        if (el) {
            setState((s) => ({
                ...s,
                player: {
                    ...s.player,
                    elementLevels: {
                        ...s.player.elementLevels,
                        [el]: Math.min(100, s.player.elementLevels[el] + 1),
                    },
                },
            }));
        }
    }
}