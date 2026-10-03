import type { Chapter } from "../types/game-state";

export const CHAPTERS: Chapter[] = [
    {
        id: "ch1",
        title: "Capítulo 1: El Despertar",
        startNodeId: "wake_up",
        nodes: {
            wake_up: {
                id: "wake_up", speaker: "Narrador",
                text: "Abres los ojos. El frío de la mazmorra sagrada te atraviesa. Tu pecho se siente pesado... como si olvidaras un poder ancestral.",
                nextNodeId: "wake_up_2",
                bg: "ch1_cell",
            },
            wake_up_2: {
                id: "wake_up_2", speaker: "Narrador",
                text: "Un dolor punzante recorre tu cabeza. Entonces lo escuchas... un eco lejano, cargado de odio: “¡Traidor del Concilio!”",
                nextNodeId: "wake_up_3",
                bg: "ch1_cell",
            },
            wake_up_3: {
                id: "wake_up_3", speaker: "Narrador",
                text: "Tus brazos y piernas están sujetos por cadenas rúnicas. Pero la magia en tus venas comienza a responder.",
                nextNodeId: "first_choice",
                bg: "ch1_cell",
            },
            first_choice: {
                id: "first_choice", speaker: "Narrador",
                text: "El sello rúnico parpadea con debilidad. ¿Cómo eliges liberarte?",
                completes: [{ questId: "main_escape_prison", objectiveId: "break_chains" }],
                options: [
                    {
                        text: "Romper las cadenas con fuerza física",
                        effect: { hpChange: -5, physical_strength: 2 },
                        consequence: "Las cadenas ceden con un estallido. Sientes cómo tus músculos se reajustan.",
                        setFlags: { broke_force: true },
                        nextNodeId: "look_around",
                    },
                    {
                        text: "Disolver las runas mediante concentración arcana",
                        effect: { manaChange: 15, magical_strength: 2 },
                        consequence: "El flujo de maná rompe el sello. Tu mente recupera claridad.",
                        setFlags: { broke_arcane: true },
                        nextNodeId: "look_around",
                    },
                    {
                        text: "Escuchar el susurro de la oscuridad",
                        effect: { corruption: 10, sanity: -10 },
                        consequence: "Una corriente de maná infernal rompe las ataduras. Sientes una presencia observándote.",
                        setFlags: { broke_dark: true },
                        nextNodeId: "look_around",
                    },
                ],
            },
            look_around: {
                id: "look_around", speaker: "Narrador",
                text: "Miras a tu alrededor. Los pasillos están custodiados por sirvientes del Concilio. Al fondo divisas el camino hacia la salida.",
                variants: [
                    {
                        when: { flag: "broke_dark" },
                        text: "Tus ojos se acostumbran a la oscuridad demasiado bien. A tus pies, tu sombra se mueve medio segundo tarde. Al fondo divisas el camino hacia la salida.",
                    },
                ],
                nextNodeId: "jail_guard_encounter",
            },
            jail_guard_encounter: {
                id: "jail_guard_encounter", speaker: "Guardia de la Prisión",
                text: "¡El prisionero arcano ha despertado! ¡No dejen que cruce las puertas sagradas!",
                options: [
                    {
                        text: "Luchar contra el Guardia de la Prisión",
                        triggerEnemyId: "guard_jail_1",
                        completes: [{ questId: "main_escape_prison", objectiveId: "defeat_guard" }],
                        nextNodeId: "ch1_victory",
                    },
                ],
            },
            ch1_victory: {
                id: "ch1_victory", speaker: "Narrador",
                text: "El guardia cae. Su llavero tintinea... pero la salida no es una sola puerta: es el bastión entero. Pasillos, patios, un Capitán que no dormirá hasta verte muerto.",
                options: [{ text: "Avanzar hacia el bastión", effect: { xp: 20 }, nextNodeId: "ch1_gate" }],
            },
            ch1_gate: {
                id: "ch1_gate", speaker: "Narrador",
                gate: {
                    flag: "ch1_boss_down",
                    text: "El camino a la libertad cruza todo el bastión. Abre el Mapa de Viaje y avanza hasta la Sala del Capitán. Aliados, descanso y secretos te esperan en el camino.",
                },
                text: "Las puertas del bastión se abren ante ti, y por fin entiendes cuánto camino has recorrido.",
                nextNodeId: "ch1_outro",
            },
            ch1_outro: {
                id: "ch1_outro", speaker: "Narrador",
                text: "Afuera: viento, cielo, un mundo que olvidó tu nombre. Al sur, entre la niebla, las ruinas de Oakhaven parecen llamarte.",
                reactions: [
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Oakhaven... allí cayó el último templo del Alba." },
                ],
                options: [
                    { text: "Avanzar al Reino Caído de Oakhaven (Capítulo 2)", effect: { xp: 40 }, nextChapterId: "ch2", returnToHub: true },
                ],
            },
        },
    },

    {
        id: "ch2",
        title: "Capítulo 2: El Reino Caído de Oakhaven",
        startNodeId: "ch2_intro",
        nodes: {
            ch2_intro: {
                id: "ch2_intro", speaker: "Narrador",
                text: "Llegas a las ruinas de Oakhaven, una antigua metrópolis devastada por la gran guerra divina. Una niebla carmesí cubre los edificios de piedra.",
                completes: [{ questId: "main_reach_oakhaven", objectiveId: "enter_oakhaven" }],
                nextNodeId: "ch2_encounter_veriana",
            },
            ch2_encounter_veriana: {
                id: "ch2_encounter_veriana", speaker: "Veríana la Archivista",
                text: "Sabía que vendrías, Kael'Rin. Los Siete Dioses intentaron borrarte de la historia, pero el sello de Oakhaven aún guarda tus memorias. Ven a mi santuario cuando puedas; el Archiduque no se irá.",
                nextNodeId: "ch2_choice",
            },
            ch2_choice: {
                id: "ch2_choice", speaker: "Veríana la Archivista",
                text: "El Archiduque Abisal custodia el Fragmento de la Aguja. ¿Con qué espíritu lo enfrentarás?",
                reactions: [
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "La luz no exige que seas perfecto. Solo que no dejes de intentarlo." },
                    { when: { companion: "kaelen" }, speaker: "Kaelen", text: "Elige rápido. Las ruinas no se limpian solas." },
                ],
                options: [
                    {
                        text: "Reclamar la reliquia con poder purificador",
                        effect: { celestial: 20, sanity: 10 },
                        consequence: "Fortaleces tu vínculo celestial. Veríana te bendice con energía santa.",
                        setFlags: { ch2_path_light: true },
                        nextNodeId: "ch2_gate",
                    },
                    {
                        text: "Consumir las almas caídas del reino",
                        effect: { infernal: 30, corruption: 15 },
                        consequence: "La bruma carmesí alimenta tu poder infernal a costa de tu cordura.",
                        setFlags: { ch2_path_dark: true },
                        nextNodeId: "ch2_gate",
                    },
                ],
            },
            ch2_gate: {
                id: "ch2_gate", speaker: "Narrador",
                gate: {
                    flag: "ch2_boss_down",
                    text: "El Archiduque aún custodia la Aguja. Abre el Mapa de Viaje y abre camino hasta la Ciudadela. Veríana, el Mercado Maldito y los Barrios Devastados guardan respuestas por el camino.",
                },
                text: "El Fragmento de la Aguja pulsa en tu mano. Al norte, la torre te llama.",
                nextNodeId: "ch2_cleared",
            },
            ch2_cleared: {
                id: "ch2_cleared", speaker: "Narrador",
                text: "El Archiduque cae hecho cenizas. El Fragmento de la Aguja resplandece en tus manos, abriendo el camino hacia el dominio celestial.",
                variants: [
                    {
                        when: { flag: "ch2_path_dark" },
                        text: "El Archiduque cae hecho cenizas, y su poder se funde con el tuyo. El Fragmento de la Aguja arde con un brillo carmesí que no es suyo.",
                    },
                    {
                        when: { flag: "ch2_path_light" },
                        text: "El Archiduque se disuelve en luz y no en cenizas. El Fragmento de la Aguja brilla claro, como si te perdonara.",
                    },
                ],
                options: [
                    { text: "Ascender a la Aguja de la Eternidad (Capítulo 3)", effect: { xp: 60 }, nextChapterId: "ch3", returnToHub: true },
                ],
            },
        },
    },

    {
        id: "ch3",
        title: "Capítulo 3: La Aguja de la Eternidad",
        startNodeId: "ch3_intro",
        nodes: {
            ch3_intro: {
                id: "ch3_intro", speaker: "Narrador",
                text: "Te erguís en la base de la Aguja de la Eternidad. Las nubes se abren y, muy arriba, se adivina el santuario del Alto Concilio.",
                completes: [{ questId: "main_eternal_spire", objectiveId: "reach_spire" }],
                nextNodeId: "ch3_gate",
            },
            ch3_gate: {
                id: "ch3_gate", speaker: "Narrador",
                gate: {
                    flag: "ch3_sanctum",
                    text: "La Aguja es larga y cada nivel guarda algo. Abre el Mapa de Viaje y asciende hasta el Sanctum del Alto Concilio.",
                },
                text: "Los siete tronos te esperan. El Eco Celestial aparece ante ti.",
                nextNodeId: "ch3_confrontation",
            },
            ch3_confrontation: {
                id: "ch3_confrontation", speaker: "Eco Celestial",
                text: "Has llegado al final del camino. Tus acciones y elecciones determinarán la arquitectura del nuevo mundo.",
                completes: [{ questId: "main_eternal_spire", objectiveId: "choose_path" }],
                reactions: [
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Pase lo que pase, no te elegí por tu poder." },
                    { when: { companion: "kaelen" }, speaker: "Kaelen", text: "Elige, y yo me encargo de que nadie lo discuta." },
                    { when: { companion: "vaelen" }, speaker: "Vaelen", text: "Mi espada sigue a quien elige. No a quien duda." },
                ],
                options: [
                    {
                        text: "Reclamar el Trono del Caos (Ruta Oscura)",
                        when: { minCorruption: 40 },
                        effect: { corruption: 30 },
                        consequence: "La corrupción alcanza su punto culminante. Invocas la manifestación demoníaca.",
                        setFlags: { route_dark: true },
                        nextNodeId: "boss_dark",
                    },
                    {
                        text: "Restaurar el Juicio Sagrado (Ruta Celestial)",
                        when: { maxCorruption: 60 },
                        effect: { sanity: 30 },
                        consequence: "Canalizas la luz pura de la aurora sagrada.",
                        setFlags: { route_light: true },
                        nextNodeId: "boss_light",
                    },
                    {
                        text: "Destruir el Trono Divino (Ruta del Equilibrio)",
                        effect: { stability: 30 },
                        consequence: "Decides romper el ciclo de los dioses para siempre.",
                        setFlags: { route_balance: true },
                        nextNodeId: "boss_balance",
                    },
                ],
            },
            boss_dark: {
                id: "boss_dark", speaker: "El Dios Carmesí del Caos",
                text: "¡Nuestra sed de dominio renace en la oscuridad!",
                options: [{ text: "Combatir al Dios Carmesí del Caos", triggerEnemyId: "god_crimson", nextNodeId: "ending_node" }],
                bg: "ch3_dark",
            },
            boss_light: {
                id: "boss_light", speaker: "La Entidad Celestial Prístina",
                text: "Demuestra la pureza de tu convicción mortal.",
                options: [{ text: "Desafiar a la Entidad Celestial", triggerEnemyId: "celestial_pristine", nextNodeId: "ending_node" }],
                bg: "ch3_light",
            },
            boss_balance: {
                id: "boss_balance", speaker: "El Guardián del Destino",
                text: "Solo quien domina la sombra y la luz puede pasar.",
                options: [{ text: "Enfrentar al Guardián del Destino", triggerEnemyId: "guardian_destiny", nextNodeId: "ending_node" }],
                bg: "ch3_balance",
            },
            ending_node: {
                id: "ending_node", speaker: "Narrador",
                text: "La batalla final concluye. El velo del destino se rasga para revelar el epílogo de tu aventura...",
                completes: [{ questId: "main_eternal_spire", objectiveId: "final_boss" }],
                options: [{ text: "Contemplar el Final de la Leyenda", effect: { xp: 100 }, endGame: true }],
                bg: "ending",
            },
        },
    },
];

export function getChapterById(id: string): Chapter {
    return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0];
}