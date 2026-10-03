import type { Stats, Mana } from "../types/player.type";
import type { Companion } from "../types/companion.type";

export interface EndingDetails {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    type: "dark" | "light" | "balance" | "insanity" | "conquest";
    icon: string;
    color: string;
}

export function getEnding(stats: Stats, xp: number): string {
    const ending = getEndingDetails(stats, xp, { mana: 0, maxMana: 100, celestial: 0, maxCelestial: 100, infernal: 0, maxInfernal: 100 }, []);
    return `${ending.title}: ${ending.description}`;
}

export function getEndingDetails(
    stats: Stats,
    xp: number,
    mana: Mana,
    party: Companion[]
): EndingDetails {
    if (stats.sanity <= 0) {
        return {
            id: "insanity",
            title: "FINAL I: La Caída en la Demencia",
            subtitle: "Tu mente se quebró bajo el peso del velo",
            description:
                "Los susurros de la oscuridad devoraron tu juicio. Ya no recuerdas quién eras ni por qué luchabas. Vagante sin rumbo, te has convertido en la misma pesadilla que intentabas detener.",
            type: "insanity",
            icon: "👁️‍🗨️",
            color: "#a855f7",
        };
    }

    if (stats.corruption >= 70 || mana.infernal >= 80) {
        return {
            id: "dark_lord",
            title: "FINAL II: El Señor del Caos Primigenio",
            subtitle: "Abrazaste la corrupción para reclamar tu trono",
            description:
                "Con la sangre de los Siete Dioses en tus manos y el fuego infernal corriendo por tus venas, reclamas el trono de la eternidad. El mundo tiembla ante tu nombre, sometido bajo tu dominio implacable.",
            type: "dark",
            icon: "👑🔥",
            color: "#ef4444",
        };
    }

    if (stats.sanity >= 75 && mana.celestial >= 60) {
        return {
            id: "celestial_martyr",
            title: "FINAL III: El Restaurador de la Luz Alba",
            subtitle: "Purificaste el mundo a través de la templanza",
            description:
                "Rechazando la sed de venganza, canalizaste la luz celestial para sellar la brecha mágica. Aunque tu cuerpo mortal se disolvió en la aurora, tu espíritu protege a los reinos por toda la eternidad.",
            type: "light",
            icon: "✨🛡️",
            color: "#eab308",
        };
    }

    if (party.filter((c) => c.isRecruited).length >= 2 && xp >= 350) {
        return {
            id: "party_hero",
            title: "FINAL IV: La Alianza de las Sombras y la Luz",
            subtitle: "No caminaste solo en la oscuridad",
            description:
                "Junto a tus leales aliados, reconstruiste el equilibrio roto del mundo. El Concilio de los Dioses ha caído, pero en su lugar nace una nueva era guiada por la camaradería y la justicia.",
            type: "conquest",
            icon: "🤝📜",
            color: "#3b82f6",
        };
    }

    return {
        id: "balance_walker",
        title: "FINAL V: El Caminante del Eclipse",
        subtitle: "Ni dios ni demonio... Algo enteramente nuevo",
        description:
            "Equilibraste la luz y la tiniebla en tu pecho. Rompiste el ciclo interminable de los dioses sin sucumbir al caos. Te adentras en lo desconocido como el guardián silencioso de la realidad.",
        type: "balance",
        icon: "☯️🔮",
        color: "#10b981",
    };
}