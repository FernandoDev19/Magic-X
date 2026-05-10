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
                text: "Abres los ojos. El frío te atraviesa. Tu pecho se siente pesado… como si olvidaras algo importante.",
                nextNodeId: "wake_up_2",
            },
            wake_up_2: {
                id: "wake_up_2",
                speaker: "Narrador",
                text: 'Un dolor punzante recorre tu cabeza. Entonces lo escuchas… un eco lejano, cargado de odio: "¡Traidor!"',
                nextNodeId: "wake_up_3",
            },
            wake_up_3: {
                id: "wake_up_3",
                speaker: "Narrador",
                text: "Intentas moverte… pero no puedes. Tus brazos… tus piernas… están sujetas por cadenas frías.",
                nextNodeId: "first_choice",
            },

            first_choice: {
                id: "first_choice",
                speaker: "Narrador",
                text: "Algo dentro de ti se agita. No sabes si es miedo… o algo más antiguo.",
                options: [
                    {
                        text: "Romper las cadenas por la fuerza",
                        effect: { stability: -5 },
                        consequence:
                            "Las cadenas ceden. No debería ser posible… pero tu cuerpo no parece seguir las reglas normales.",
                        nextNodeId: "look_around",
                    },
                    {
                        text: "Analizar las cadenas cuidadosamente",
                        effect: { stability: +5 },
                        consequence:
                            "Notas imperfecciones… como si la realidad estuviera mal construida. Aprovechas eso para liberarte.",
                        nextNodeId: "look_around",
                    },
                    {
                        text: "Detenerte… y escuchar esa voz",
                        effect: { corruption: +10, stability: -5, sanity: -10 },
                        consequence:
                            'El eco regresa: "Traidor…" Esta vez más cerca. Algo en ti responde.',
                        nextNodeId: "second_choice",
                    },
                ],
            },

            second_choice: {
                id: "second_choice",
                speaker: "Eco",
                text: "¿Qué quieres saber?",
                options: [
                    {
                        text: "¿Quién soy?",
                        effect: { stability: -10 },
                        consequence:
                            "No hay respuesta. Solo el eco repitiendo: 'Traidor…'",
                        nextNodeId: "look_around",
                    },
                    {
                        text: "¿Qué es este lugar?",
                        nextNodeId: "what_is_this_place",
                    },
                ],
            },

            what_is_this_place: {
                id: "what_is_this_place",
                speaker: "Eco",
                text: "Este lugar... Es lo que te mereces...",
                nextNodeId: "what_is_this_place_2",
            },

            what_is_this_place_2: {
                id: "what_is_this_place_2",
                speaker: "Narrador",
                text: `El eco se aleja...`,
                nextNodeId: "what_is_this_place_3",
            },

            what_is_this_place_3: {
                id: "what_is_this_place_3",
                speaker: "Narrador",
                text: `...Parece haberse ido.`,
                nextNodeId: "try_to_escape",
            },

            try_to_escape: {
                id: "try_to_escape",
                speaker: "Narrador",
                text: "No sabes que ha sido eso, pero sientes que debes escapar de aquí.",
                options: [
                    {
                        text: "Romper las cadenas por la fuerza",
                        effect: { stability: -5 },
                        consequence:
                            "Las cadenas ceden. No debería ser posible… pero tu cuerpo no parece seguir las reglas normales.",
                        nextNodeId: "look_around",
                    },
                    {
                        text: "Analizar las cadenas cuidadosamente",
                        effect: { stability: +5 },
                        consequence:
                            "Notas imperfecciones… como si la realidad estuviera mal construida. Aprovechas eso para liberarte.",
                        nextNodeId: "look_around",
                    },
                ],
            },

            // ENTORNO
            look_around: {
                id: "look_around",
                speaker: "Narrador",
                text: `Miras a tu alrededor. Una sala de piedra. Oscura. Húmeda.  
                    Hay más cadenas… pero están vacías.`,
                nextNodeId: "look_around_2",
            },
            look_around_2: {
                id: "look_around_2",
                speaker: "Narrador",
                text: "En las paredes, símbolos extraños. No los entiendes… pero te resultan familiares.",
                nextNodeId: "prison_hall",
            },

            prison_hall: {
                id: "prison_hall",
                speaker: "Narrador",
                text: `Sales de la celda. El pasillo es estrecho, iluminado por antorchas débiles.  
                    El aire… se siente pesado. Como si algo aquí no quisiera que existieras.`,
                nextNodeId: "prison_hall_2",
            },

            prison_hall_2: {
                id: "prison_hall_2",
                speaker: "Narrador",
                text: "Un guardia aparece al fondo. Sus ojos se abren al verte libre.",
                options: [
                    {
                        text: "Enfrentarlo",
                        nextNodeId: "guard_fight_intro",
                    },
                    {
                        text: "Observar su energía",
                        nextNodeId: "guard_analyze",
                    },
                ],
            },

            // Enfrentarlo
            guard_fight_intro: {
                id: "guard_fight_intro",
                speaker: "Guardia de la Prisión",
                text: "¡¿Cómo te soltaste?! ¡Vuelve a tu celda ahora!",
                nextNodeId: "guard_fight_intro_2",
            },

            guard_fight_intro_2: {
                id: "guard_fight_intro_2",
                speaker: "Narrador",
                text: "¡El guardia se prepara para pelear!",
                options: [
                    {
                        text: "Prepararse para pelear",
                        returnToHub: true,
                        nextNodeId: "guard_fight",
                    },
                ],
            },

            guard_fight: {
                id: "guard_fight",
                text: "El guardia de la prisión te ataca.",
                triggerEnemyId: "guard_jail_1",
            },
        },
    },
];

// EXAMPLE:
// {
//     id: "ch1",
//     title: "Capítulo 1: El Despertar",
//     startNodeId: "wake_up",
//     nodes: {
//         "wake_up": {
//             id: "wake_up",
//             text: "Abres los ojos. Sientes el lodo frío contra tu mejilla, un contraste humillante para alguien que alguna vez sostuvo mundos enteros en la palma de su mano.",
//             nextNodeId: "wake_up_2",
//         },
//         "wake_up_2": {
//             id: "wake_up_2",
//             speaker: "Kael'Rin",
//             text: "¿Dónde... dónde estoy? Mi poder... se ha desvanecido. Este cuerpo humano es asquerosamente frágil.",
//             nextNodeId: "wake_up_3",
//         },
//         "wake_up_3": {
//             id: "wake_up_3",
//             text: "A tu lado yace tu grimorio, cerrado por sellos de magia olvidada, y una daga oxidada. A los pocos metros, un aldeano aterrorizado te observa desde entre los árboles. Sus ojos reconocen la oscura presencia que aún emana de ti.",
//             options: [
//                 {
//                     text: "Absorber su alma para recuperar poder",
//                     effect: { manaChange: +20, corruption: +15, gainItemId: "grimoire", gainItemId2: "rusty_dagger", gainSpellId: "soul_trap_1" },
//                     consequence: "El aldeano cae sin vida. Sientes el flujo de Maná Infernal invadir tus venas. Recoges tu grimorio y la daga.",
//                     nextNodeId: "post_villager"
//                 },
//                 {
//                     text: "Tomar tus cosas y dejarlo huir",
//                     effect: { hpChange: +10, physical_strength: +5, gainItemId: "grimoire", gainItemId2: "rusty_dagger", gainSpellId: "vital_buff_1" },
//                     consequence: "El aldeano huye gritando mientras agarras la daga y el grimorio. Al incorporarte sientes que tu fuerza física se estabiliza ligeramente.",
//                     nextNodeId: "post_villager"
//                 },
//                 {
//                     text: "Exigirle información",
//                     effect: { sanity: +15, gainItemId: "grimoire", gainItemId2: "rusty_dagger" },
//                     consequence: "Aterrorizado, te habla sobre la tiranía actual de los Siete Dioses usurpadores antes de salir corriendo. Entender tu situación te calma.",
//                     nextNodeId: "post_villager"
//                 }
//             ]
//         },
//         "post_villager": {
//             id: "post_villager",
//             speaker: "Kael'Rin",
//             text: "Así que los Siete me han despojado y han reclamado el mundo... Patéticas creaciones volviéndose contra su creador. Arderán por esto.",
//             nextNodeId: "forest_path",
//         },
//         "forest_path": {
//             id: "forest_path",
//             text: "Te adentras en el bosque buscando refugio, pero el sonido de pisadas interrumpe tus pensamientos. Un grupo de lobos acecha en la maleza, sus ojos brillan con una magia residual corrupta.",
//             speaker: "Narrador",
//             nextNodeId: "prepare_combat"
//         },
//         "prepare_combat": {
//             id: "prepare_combat",
//             speaker: "Kael'Rin",
//             text: "No tengo tiempo para jugar con mascotas. Acabaré con esto rápido.",
//             options: [
//                 {
//                     text: "Prepararse para el combate",
//                     nextNodeId: "wolf_combat",
//                     returnToHub: true
//                 }
//             ]
//         },
//         "wolf_combat": {
//             id: "wolf_combat",
//             text: "La manada de lobos malditos se abalanza sobre ti. ¡Defiéndete!",
//             triggerEnemyId: "wolf",
//             nextNodeId: "post_combat"
//         },
//         "post_combat": {
//             id: "post_combat",
//             text: "La sangre de las bestias cubre la maleza. Has sobrevivido a tu primer enfrentamiento, pero el camino hacia tu venganza apenas comienza.",
//             speaker: "Narrador",
//             options: [
//                 {
//                     text: "Explorar los restos del bosque",
//                     nextNodeId: "end_chapter",
//                 }
//             ]
//         },
//         "end_chapter": {
//             id: "end_chapter",
//             text: "(Fin de la demo del Capítulo 1. Próximamente más capítulos en el acceso anticipado.)",
//             returnToHub: true
//         }
//     }
// }
