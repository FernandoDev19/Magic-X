import type { Quest } from "../types/quest.type";

export const ALL_QUESTS: Quest[] = [
    // ── Capítulo 1 – Misiones Principales ────────────────────────────────
    {
        id: "main_escape_prison",
        title: "La Fuga de la Mazmorra Sagrada",
        description: "Escapa de la prisión del Concilio de los Siete. Derrota al Guardia y cruza las puertas prohibidas.",
        category: "main",
        status: "active",
        icon: "⛓️",
        chapterId: "ch1",
        objectives: [
            { id: "break_chains", description: "Libérate de las cadenas rúnicas", completed: false },
            { id: "defeat_guard", description: "Derrota al Guardia de la Prisión", completed: false },
            { id: "exit_prison", description: "Cruza las puertas del bastión", completed: false },
        ],
        reward: { xp: 80, gold: 50, description: "+80 XP, +50 Oro" },
    },
    {
        id: "main_reach_oakhaven",
        title: "Rumbo a Oakhaven",
        description: "El antiguo reino de Oakhaven guarda las memorias de tu verdadero origen. Llega a sus ruinas y habla con Veríana la Archivista.",
        category: "main",
        status: "locked",
        icon: "🏚️",
        chapterId: "ch2",
        objectives: [
            { id: "enter_oakhaven", description: "Llega a las ruinas de Oakhaven", completed: false },
            { id: "meet_veriana", description: "Encuentra a Veríana la Archivista", completed: false },
            { id: "defeat_archduke", description: "Derrota al Archiduque Abisal", completed: false },
        ],
        reward: { xp: 200, gold: 120, description: "+200 XP, +120 Oro, Fragmento de la Aguja" },
    },
    {
        id: "main_eternal_spire",
        title: "La Aguja de la Eternidad",
        description: "Asciende hasta el santuario del Concilio y decide el destino del mundo.",
        category: "main",
        status: "locked",
        icon: "⚡",
        chapterId: "ch3",
        objectives: [
            { id: "reach_spire", description: "Llega a la Aguja de la Eternidad", completed: false },
            { id: "choose_path", description: "Elige tu camino: Caos, Luz o Equilibrio", completed: false },
            { id: "final_boss", description: "Derrota al guardián de tu destino", completed: false },
        ],
        reward: { xp: 500, description: "+500 XP, Desbloquea el Final" },
    },

    // ── Capítulo 1 – Misiones Secundarias ────────────────────────────────
    {
        id: "side_explore_ruins",
        title: "Las Ruinas del Pasado",
        description: "Los corredores de la prisión esconden cámaras secretas con pergaminos prohibidos. Encuéntralos antes de escapar.",
        category: "secondary",
        status: "active",
        icon: "📜",
        chapterId: "ch1",
        triggeredByLocation: "loc_ch1_prison_corridor",
        objectives: [
            { id: "find_scrolls", description: "Busca las cámaras secretas en el mapa de la prisión", completed: false },
            { id: "read_runes", description: "Descifra los símbolos rúnicos (visita el Altar)", completed: false },
        ],
        reward: { xp: 40, spellId: "shadow_manipulation", description: "+40 XP, Aprende Manipulación de Sombras" },
    },
    {
        id: "side_strength_trial",
        title: "La Prueba del Dios Caído",
        description: "Dentro del bastión viven criaturas que testean la fuerza de los dioses. Derrota 3 tipos de enemigos en el mapa.",
        category: "secondary",
        status: "active",
        icon: "⚔️",
        chapterId: "ch1",
        objectives: [
            { id: "kill_bandits", description: "Derrota Bandidos (Combate Normal)", completed: false },
            { id: "kill_wolves", description: "Derrota Lobos Alfa (Combate Normal)", completed: false },
            { id: "kill_elite", description: "Sobrevive al Combate de Élite del mapa", completed: false },
        ],
        reward: { xp: 60, gold: 80, description: "+60 XP, +80 Oro" },
    },

    // ── Capítulo 1 – Misiones de Exploración ─────────────────────────────
    {
        id: "exp_first_rest",
        title: "El Primer Descanso",
        description: "Antes de enfrentar el mundo, tómate un momento para recuperarte. Usa un campamento en el mapa.",
        category: "exploration",
        status: "active",
        icon: "⛺",
        chapterId: "ch1",
        objectives: [
            { id: "use_campfire", description: "Descansa en una Hoguera del mapa", completed: false },
        ],
        reward: { xp: 20, description: "+20 XP" },
    },
    {
        id: "exp_altar_duality",
        title: "Ante el Altar",
        description: "Busca el Altar de la Dualidad y elige canalizar energía celestial o infernal.",
        category: "exploration",
        status: "active",
        icon: "🔮",
        chapterId: "ch1",
        objectives: [
            { id: "visit_altar", description: "Visita el Altar de la Dualidad en el mapa", completed: false },
        ],
        reward: { xp: 30, description: "+30 XP, +20 Maná de tu tipo" },
    },

    // ── Misiones de Compañeros ────────────────────────────────────────────
    {
        id: "comp_find_lyra",
        title: "La Sacerdotisa Perdida",
        description: "Se rumorea que una sacerdotisa de la Orden Alba fue exiliada en las mazmorras. Encuéntrala y gana su confianza.",
        category: "companion",
        status: "active",
        icon: "✨",
        chapterId: "ch1",
        companionId: "lyra",
        objectives: [
            { id: "find_lyra_loc", description: "Visita el nodo 'Refugio del Aliado' en el mapa Ch1", completed: false },
            { id: "recruit_lyra", description: "Recluta a Lyra como compañera", completed: false },
        ],
        reward: { xp: 50, description: "+50 XP, Lyra se une al equipo" },
    },
    {
        id: "comp_find_kaelen",
        title: "El Asesino de las Sombras",
        description: "En las ruinas de Oakhaven acecha un asesino que sirve a sus propios intereses. Convéncelo de que tu causa es la suya.",
        category: "companion",
        status: "locked",
        icon: "🗡️",
        chapterId: "ch2",
        companionId: "kaelen",
        objectives: [
            { id: "find_kaelen_loc", description: "Visita el nodo 'Refugio del Aliado' en el mapa Ch2", completed: false },
            { id: "recruit_kaelen", description: "Recluta a Kaelen como compañero", completed: false },
        ],
        reward: { xp: 80, description: "+80 XP, Kaelen se une al equipo" },
    },
    {
        id: "comp_find_vaelen",
        title: "El Guerrero sin Causa",
        description: "En la Aguja de la Eternidad hay un guerrero que busca un propósito. Demuéstrale el tuyo.",
        category: "companion",
        status: "locked",
        icon: "🛡️",
        chapterId: "ch3",
        companionId: "vaelen",
        objectives: [
            { id: "find_vaelen_loc", description: "Visita el nodo 'Refugio del Aliado' en el mapa Ch3", completed: false },
            { id: "recruit_vaelen", description: "Recluta a Vaelen como compañero", completed: false },
        ],
        reward: { xp: 100, description: "+100 XP, Vaelen se une al equipo" },
    },

    // ── Capítulo 2 – Secundarias ─────────────────────────────────────────
    {
        id: "side_oakhaven_memories",
        title: "Fragmentos de Oakhaven",
        description: "Las ruinas guardan visiones del pasado de Kael'Rin. Encuentra todos los fragmentos de memoria en el mapa.",
        category: "secondary",
        status: "locked",
        icon: "🧩",
        chapterId: "ch2",
        objectives: [
            { id: "vision_1", description: "Encuentra la primera Visión del Pasado", completed: false },
            { id: "visit_shop_ch2", description: "Visita la Caravana del Mercader en Ch2", completed: false },
        ],
        reward: { xp: 70, gold: 60, description: "+70 XP, +60 Oro" },
    },
];

export function getQuestById(id: string): Quest | undefined {
    return ALL_QUESTS.find((q) => q.id === id);
}

export function getQuestsByChapter(chapterId: string): Quest[] {
    return ALL_QUESTS.filter((q) => q.chapterId === chapterId);
}

export function getActiveQuests(quests: Quest[]): Quest[] {
    return quests.filter((q) => q.status === "active");
}
