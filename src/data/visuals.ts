/** Pon en false para desactivar imágenes y usar solo los fondos/emoji de reserva */
export const USE_IMAGES = true;

export interface Visual {
    icon: string;   // reserva si no hay imagen
    color: string;
    src?: string;
}

const p = (f: string) => `/art/portraits/${f}.webp`;

/** La clave es el nombre exacto del `speaker` en events.ts / scenes.ts (y el nombre del compañero) */
export const PORTRAITS: Record<string, Visual> = {
    "Kael'Rin": { icon: "⚡", color: "#c9a84c", src: p("kaelrin") },
    Lyra: { icon: "✨", color: "#FAC775", src: p("lyra") },
    Kaelen: { icon: "🗡️", color: "#7F77DD", src: p("kaelen") },
    Vaelen: { icon: "🛡️", color: "#E89F5B", src: p("vaelen") },
    Aurelia: { icon: "🌊", color: "#378ADD", src: p("aurelia") },
    "Veríana la Archivista": { icon: "📚", color: "#5DCAA5", src: p("veriana") },
    "Capitán del Concilio": { icon: "⚜️", color: "#c9a84c", src: p("capitan") },
    "Guardia de la Prisión": { icon: "🛡️", color: "#888888", src: p("guardia") },
    "Prisionero Anciano": { icon: "🧓", color: "#999999", src: p("anciano") },
    "Espíritu de Oakhaven": { icon: "👻", color: "#85B7EB", src: p("espiritu") },
    "Archiduque Abisal": { icon: "👹", color: "#E24B4A", src: p("archiduque") },
    "Los Cristales": { icon: "💎", color: "#AFA9EC", src: p("cristales") },
    "Eco Celestial": { icon: "🌟", color: "#FAC775", src: p("eco") },
    "El Dios Carmesí del Caos": { icon: "🔥", color: "#E24B4A", src: p("dios_carmesi") },
    "La Entidad Celestial Prístina": { icon: "👼", color: "#FAC775", src: p("entidad") },
    "El Guardián del Destino": { icon: "⚖️", color: "#5DCAA5", src: p("guardian") },
};

export interface Backdrop {
    gradient: string;
    label?: string; // nombre del lugar, se muestra sobre el fondo
    src?: string;
}

const mk = (key: string, label: string, from: string, to: string): Backdrop => ({
    label,
    src: `/art/backgrounds/${key}.webp`,
    gradient: `radial-gradient(ellipse at 50% 75%, ${from} 0%, ${to} 78%)`,
});

/** Claves: id de escena, id de capítulo, o el `bg` de un nodo */
export const BACKGROUNDS: Record<string, Backdrop> = {
    default: { gradient: "linear-gradient(160deg, #12101e, #07070f)" },

    // Capítulo 1
    ch1: mk("ch1", "Mazmorras del Bastión", "#1f1a38", "#07070f"),
    ch1_cell: mk("ch1_cell", "Celda de la Mazmorra", "#14141f", "#050508"),
    ch1_torture: mk("ch1_torture", "Cámara de Tortura", "#2a1212", "#08060a"),
    ch1_campfire: mk("ch1_campfire", "Patio Interior", "#3a2410", "#0a0806"),
    ch1_lyra: mk("ch1_lyra", "Refugio de Lyra", "#3a3012", "#0a0a06"),
    ch1_boss: mk("ch1_boss", "Sala del Capitán", "#2a2412", "#0a0806"),

    // Capítulo 2
    ch2: mk("ch2", "Oakhaven, el Reino Caído", "#3a1212", "#0d0507"),
    ch2_slums: mk("ch2_slums", "Barrios Devastados", "#2a1520", "#0d0507"),
    ch2_camp: mk("ch2_camp", "Archivo Real", "#3a2210", "#0d0507"),
    ch2_veriana: mk("ch2_veriana", "Santuario de Veríana", "#16253a", "#05070f"),
    ch2_citadel: mk("ch2_citadel", "Ciudadela del Archiduque", "#4a0f14", "#0d0507"),

    // Capítulo 3
    ch3: mk("ch3", "La Aguja de la Eternidad", "#162a4a", "#05070f"),
    ch3_memories: mk("ch3_memories", "Galería de las Memorias", "#2a2a5a", "#05070f"),
    ch3_camp: mk("ch3_camp", "Capilla del Último Reposo", "#2a3550", "#05070f"),
    ch3_vaelen: mk("ch3_vaelen", "Torre del Guerrero Sin Causa", "#3a2a1a", "#05070f"),
    ch3_threshold: mk("ch3_threshold", "Umbral de la Decisión", "#2a2a4a", "#05070f"),
    ch3_sanctum: mk("ch3_sanctum", "Sanctum del Alto Concilio", "#3a2a5a", "#05070f"),
    ch3_dark: mk("ch3_dark", "El Trono del Caos", "#4a0f1a", "#05030a"),
    ch3_light: mk("ch3_light", "El Juicio Sagrado", "#4a4a2a", "#0a0a14"),
    ch3_balance: mk("ch3_balance", "El Trono Roto", "#1a3a3a", "#05070f"),
    ending: mk("ending", "El Final de la Leyenda", "#3a2a1a", "#05050a"),
};