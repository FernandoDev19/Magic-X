import type { Chapter } from "../types/game-state";

export const CHAPTERS: Chapter[] = [
    {
        id: "ch1",
        title: "Capítulo 1: El Despertar",
        startNodeId: "wake_up",
        nodes: {
            wake_up: {
                id: "wake_up",
                speaker: "Narrador",
                text: "Abres los ojos. El frío de la mazmorra sagrada te atraviesa. Tu pecho se siente pesado… como si olvidaras un poder ancestral.",
                nextNodeId: "wake_up_2",
            },
            wake_up_2: {
                id: "wake_up_2",
                speaker: "Narrador",
                text: 'Un dolor punzante recorre tu cabeza. Entonces lo escuchas… un eco lejano, cargado de odio: "¡Traidor del Concilio!"',
                nextNodeId: "wake_up_3",
            },
            wake_up_3: {
                id: "wake_up_3",
                speaker: "Narrador",
                text: "Tus brazos y piernas están sujetos por cadenas rúnicas. Pero la magia en tus venas comienza a responder.",
                nextNodeId: "first_choice",
            },

            first_choice: {
                id: "first_choice",
                speaker: "Narrador",
                text: "El sello rúnico parpadea con debilidad. ¿Cómo eliges liberarte?",
                options: [
                    {
                        text: "Romper las cadenas con fuerza física",
                        effect: { hpChange: -5, physical_strength: +2 },
                        consequence: "Las cadenas ceden con un estallido. Sientes cómo tus músculos se reajustan.",
                        nextNodeId: "look_around",
                    },
                    {
                        text: "Disolver las runas mediante concentración arcana",
                        effect: { manaChange: +15, magical_strength: +2 },
                        consequence: "El flujo de maná rompe el sello. Tu mente recupera claridad.",
                        nextNodeId: "look_around",
                    },
                    {
                        text: "Escuchar el susurro de la oscuridad",
                        effect: { corruption: +10, sanity: -10 },
                        consequence: "Una corriente de maná infernal rompe las ataduras. Sientes una presencia observándote.",
                        nextNodeId: "look_around",
                    },
                ],
            },

            look_around: {
                id: "look_around",
                speaker: "Narrador",
                text: "Miras a tu alrededor. Los pasillos de la prisión están custodiados por sirvientes del Concilio. Al fondo divisas la salida al mapa exterior.",
                nextNodeId: "jail_guard_encounter",
            },

            jail_guard_encounter: {
                id: "jail_guard_encounter",
                speaker: "Guardia de la Prisión",
                text: "¡El prisionero arcano ha despertado! ¡No dejen que cruce las puertas sagradas!",
                options: [
                    {
                        text: "Luchar contra el Guardia de la Prisión",
                        triggerEnemyId: "guard_jail_1",
                        nextNodeId: "ch1_victory",
                    },
                ],
            },

            ch1_victory: {
                id: "ch1_victory",
                speaker: "Narrador",
                text: "El guardia cae derrocado. Las puertas del bastión se abren ante ti. Frente a ti se despliega el mapa regional de las tierras prohibidas.",
                options: [
                    {
                        text: "Avanzar al Reino Caído de Oakhaven (Capítulo 2)",
                        nextChapterId: "ch2",
                        returnToHub: true,
                    },
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
                id: "ch2_intro",
                speaker: "Narrador",
                text: "Llegas a las ruinas de Oakhaven, una antigua metrópolis devastada por la gran guerra divina. Una niebla carmesí cubre los edificios de piedra.",
                nextNodeId: "ch2_encounter_veriana",
            },
            ch2_encounter_veriana: {
                id: "ch2_encounter_veriana",
                speaker: "Veríana la Archivista",
                text: "Sabía que vendrías Kael'Rin. Los Siete Dioses intentaron borrarte de la historia, pero el sello de Oakhaven aún conserva las memorias de tu verdadero origen.",
                nextNodeId: "ch2_choice",
            },
            ch2_choice: {
                id: "ch2_choice",
                speaker: "Veríana la Archivista",
                text: "El Archiduque Abisal custodia el Fragmento de la Aguja. ¿Cómo abordaremos el asalto?",
                options: [
                    {
                        text: "Reclamar la reliquia con poder purificador",
                        effect: { celestial: +20, sanity: +10 },
                        consequence: "Fortaleces tu vínculo celestial. Veríana te bendice con energía santa.",
                        nextNodeId: "ch2_boss_prep",
                    },
                    {
                        text: "Consumir las almas caídas del reino",
                        effect: { infernal: +30, corruption: +15 },
                        consequence: "La bruma carmesí alimenta tu poder infernal a costa de tu cordura.",
                        nextNodeId: "ch2_boss_prep",
                    },
                ],
            },
            ch2_boss_prep: {
                id: "ch2_boss_prep",
                speaker: "Archiduque Abisal",
                text: "¡Kael'Rin! ¿Te atreves a regresar a este reino marchito? ¡No dejaré que alcances la Aguja de la Eternidad!",
                options: [
                    {
                        text: "Enfrentar al Archiduque Abisal",
                        triggerEnemyId: "archduke_abyssal",
                        nextNodeId: "ch2_cleared",
                    },
                ],
            },
            ch2_cleared: {
                id: "ch2_cleared",
                speaker: "Narrador",
                text: "El Archiduque cae hecho cenizas. El Fragmento de la Aguja resplandece en tus manos, abriendo el camino hacia el dominio celestial.",
                options: [
                    {
                        text: "Ascender a la Aguja de la Eternidad (Capítulo 3)",
                        nextChapterId: "ch3",
                        returnToHub: true,
                    },
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
                id: "ch3_intro",
                speaker: "Narrador",
                text: "Te eriges en la cúspide de la Aguja de la Eternidad. Las nubes se abren y ante ti se revela el santuario del alto concilio.",
                nextNodeId: "ch3_confrontation",
            },
            ch3_confrontation: {
                id: "ch3_confrontation",
                speaker: "Eco Celestial",
                text: "Has llegado al final del camino. Tus acciones y elecciones determinarán la arquitectura del nuevo mundo.",
                options: [
                    {
                        text: "Reclamar el Trono del Caos (Ruta Oscura)",
                        effect: { corruption: +30 },
                        consequence: "La corrupción alcanza su punto culminante. Invocas la manifestación demoníaca.",
                        nextNodeId: "boss_dark",
                    },
                    {
                        text: "Restaurar el Juicio Sagrado (Ruta Celestial)",
                        effect: { sanity: +30 },
                        consequence: "Canalizas la luz pura de la aurora sagrada.",
                        nextNodeId: "boss_light",
                    },
                    {
                        text: "Destruir el Trono Divino (Ruta del Equilibrio)",
                        effect: { stability: +30 },
                        consequence: "Decides romper el ciclo de los dioses para siempre.",
                        nextNodeId: "boss_balance",
                    },
                ],
            },

            boss_dark: {
                id: "boss_dark",
                speaker: "El Dios Carmesí del Caos",
                text: "¡Nuestra sed de dominio renace en la oscuridad!",
                options: [
                    {
                        text: "Combatir al Dios Carmesí del Caos",
                        triggerEnemyId: "god_crimson",
                        nextNodeId: "ending_node",
                    },
                ],
            },

            boss_light: {
                id: "boss_light",
                speaker: "La Entidad Celestial Prístina",
                text: "Demuestra la pureza de tu convicción mortal.",
                options: [
                    {
                        text: "Desafiar a la Entidad Celestial",
                        triggerEnemyId: "celestial_pristine",
                        nextNodeId: "ending_node",
                    },
                ],
            },

            boss_balance: {
                id: "boss_balance",
                speaker: "El Guardián del Destino",
                text: "Solo quien domina la sombra y la luz puede pasar.",
                options: [
                    {
                        text: "Enfrentar al Guardián del Destino",
                        triggerEnemyId: "guardian_destiny",
                        nextNodeId: "ending_node",
                    },
                ],
            },

            ending_node: {
                id: "ending_node",
                speaker: "Narrador",
                text: "La batalla final concluye. El velo del destino se rasga para revelar el epílogo de tu aventura...",
                options: [
                    {
                        text: "Contemplar el Final de la Leyenda",
                        returnToHub: true,
                    },
                ],
            },
        },
    },
];

export function getChapterById(id: string): Chapter {
    const ch = CHAPTERS.find((c) => c.id === id);
    if (!ch) return CHAPTERS[0];
    return ch;
}
