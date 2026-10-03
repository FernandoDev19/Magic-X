import type { Chapter } from "../types/game-state";

export const SCENES: Record<string, Chapter> = {
    // ═══════════════════════ CAPÍTULO 1 ═══════════════════════
    ch1_torture: {
        id: "ch1_torture",
        title: "Cámara de Tortura",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "Cadenas oxidadas cuelgan del techo. En una mesa de piedra, un pergamino sellado con cera negra late como si tuviera pulso. En el sello, un nombre: Kael'Rin.",
                nextNodeId: "scroll",
            },
            scroll: {
                id: "scroll",
                speaker: "Narrador",
                text: "Al romper el sello, las letras se reordenan ante tus ojos: “SENTENCIA CONTRA EL DIOS CAÍDO. Por traicionar al Concilio de los Siete, su nombre será borrado, su poder sellado y su memoria dispersa.”",
                options: [
                    {
                        text: "Leer en voz alta el resto de la sentencia",
                        effect: { corruption: 8, sanity: -5, xp: 20 },
                        consequence: "Las palabras saben a ceniza. Algo en tu interior se agita al oír su verdadero nombre.",
                        setFlags: { read_sentence: true },
                        nextNodeId: "after_read",
                    },
                    {
                        text: "Quemar el pergamino",
                        effect: { sanity: 5, xp: 10 },
                        consequence: "Las llamas devoran tu nombre. Por primera vez desde que despertaste, respiras tranquilo.",
                        setFlags: { burned_sentence: true },
                        nextNodeId: "end",
                    },
                    {
                        text: "Llevarte el tomo en que venía envuelto, sin leer la sentencia",
                        effect: { gainItemId: "ancient_tome", xp: 10 },
                        consequence: "Debajo del pergamino hay un tomo en idioma divino. Pesa más de lo que debería.",
                        nextNodeId: "end",
                    },
                ],
            },
            after_read: {
                id: "after_read",
                speaker: "Narrador",
                text: "“...sin un solo testigo”, remata el texto. “Que nadie recuerde qué hizo, ni por qué.” Al margen, escrita por otra mano, una frase: “Lo hizo para detenerlos.”",
                nextNodeId: "end",
            },
            end: {
                id: "end",
                speaker: "Narrador",
                text: "Dejas la cámara. Quien escribió aquello quería que olvidaras. Todavía no sabes si eso es una amenaza... o una pista.",
            },
        },
    },

    ch1_campfire: {
        id: "ch1_campfire",
        title: "Patio Interior",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "En el patio, una hoguera mal alimentada ilumina a un prisionero anciano que remueve las brasas con un hueso. No levanta la vista.",
                nextNodeId: "ask",
            },
            ask: {
                id: "ask",
                speaker: "Prisionero Anciano",
                text: "Siéntate, siéntate. Aquí nadie pregunta de qué lado estuviste. Solo de qué lado quieres morir.",
                options: [
                    { text: "¿Qué es el Concilio de los Siete?", effect: { xp: 5 }, nextNodeId: "council" },
                    { text: "Busco una salida segura.", nextNodeId: "exit" },
                    {
                        text: "Extender la mano hacia las brasas y apagarlas con un gesto",
                        when: { minCorruption: 60 },
                        effect: { infernal: 5 },
                        consequence: "El fuego muere sin ruido. El anciano retrocede arrastrándose.",
                        nextNodeId: "scare",
                    },
                ],
            },
            council: {
                id: "council",
                speaker: "Prisionero Anciano",
                text: "Siete dioses que se repartieron el mundo como pan. Uno los traicionó, dicen. Lo borraron de los libros... pero los libros mienten por omisión. Si buscas aliados, hay una sacerdotisa escondida al este. Sus manos curan lo que el Concilio rompe.",
                nextNodeId: "end",
            },
            exit: {
                id: "exit",
                speaker: "Prisionero Anciano",
                text: "La Puerta Exterior la guarda un lobo maldito, y tras él, el Capitán. Pero al este, tras la armería, vive una sacerdotisa que conoce pasadizos que ni el Concilio recuerda.",
                nextNodeId: "end",
            },
            scare: {
                id: "scare",
                speaker: "Prisionero Anciano",
                text: "¡Esos ojos! Mis viejos ojos ya vieron esos ojos... Murmura una plegaria y no vuelve a mirarte.",
                nextNodeId: "end",
            },
            end: {
                id: "end",
                speaker: "Narrador",
                text: "Dormitas junto al fuego. Por una vez, las voces callan.",
                variants: [
                    {
                        when: { minCorruption: 70 },
                        text: "Dormitas junto al fuego, pero las llamas proyectan sombras que no te pertenecen. Las voces no callan: solo esperan.",
                    },
                ],
            },
        },
    },

    ch1_lyra: {
        id: "ch1_lyra",
        title: "Refugio Secreto de Lyra",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "El refugio huele a incienso y a hierro. Una mujer te apunta con un báculo cuyo extremo tiembla con luz dorada.",
                nextNodeId: "meet",
            },
            meet: {
                id: "meet",
                speaker: "Lyra",
                text: "Quédate donde estás. Cargas con una marca que ningún Consus debería llevar. ¿Eres un cazador del Concilio... o lo que ellos cazan?",
                variants: [
                    {
                        when: { minCorruption: 60 },
                        text: "Quédate donde estás. Huele a infierno en ti... y aun así tu alma no ha cedido del todo. ¿Quién eres?",
                    },
                ],
                options: [
                    {
                        text: "Soy Kael'Rin, el traidor del Concilio.",
                        effect: { sanity: 3 },
                        consequence: "“Un traidor honesto vale más que un santo mentiroso”, murmura Lyra.",
                        setFlags: { lyra_trust: true },
                        nextNodeId: "join",
                    },
                    {
                        text: "No lo sé. Solo sé que debo salir de aquí.",
                        effect: { sanity: 2, xp: 10 },
                        setFlags: { lyra_pity: true },
                        nextNodeId: "join",
                    },
                    {
                        text: "Aparta el báculo. No tengo tiempo para sermones.",
                        effect: { corruption: 5 },
                        setFlags: { lyra_distrust: true },
                        nextNodeId: "join_cold",
                    },
                    {
                        text: "Dejar que la oscuridad de tu mano responda por ti",
                        when: { minCorruption: 60 },
                        effect: { corruption: 8, infernal: 10 },
                        consequence: "Lyra palidece, pero no baja la guardia.",
                        setFlags: { lyra_distrust: true },
                        nextNodeId: "join_cold",
                    },
                ],
            },
            join: {
                id: "join",
                speaker: "Lyra",
                text: "La luz no me dijo que fueras inocente. Me dijo que no estuviera sola cuando llegaras. Iré contigo, Kael'Rin. Pero si la oscuridad te gana... seré yo quien te detenga.",
                variants: [
                    {
                        when: { flag: "lyra_pity" },
                        text: "No saber quién eres no es un pecado. Dejarte solo, quizá sí. Iré contigo, Kael'Rin.",
                    },
                ],
                nextNodeId: "recruit",
            },
            join_cold: {
                id: "join_cold",
                speaker: "Lyra",
                text: "No me gusta tu forma de pedir. Pero tampoco me gusta cómo el Concilio pide. Iré... y te vigilaré.",
                nextNodeId: "recruit",
            },
            recruit: {
                id: "recruit",
                speaker: "Narrador",
                text: "✨ Lyra, Sacerdotisa del Alba, se une a tu grupo.",
                recruitCompanion: "lyra",
                completes: [{ questId: "comp_find_lyra", objectiveId: "recruit_lyra" }],
            },
        },
    },

    ch1_boss: {
        id: "ch1_boss",
        title: "Sala del Capitán del Concilio",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "La sala es un anfiteatro de piedra negra. Al fondo, una armadura dorada se alza; tras el visor no hay rostro, solo un resplandor.",
                nextNodeId: "taunt",
            },
            taunt: {
                id: "taunt",
                speaker: "Capitán del Concilio",
                text: "Prisionero Cero. Dios sin nombre. El Concilio me ordenó que no te dejara cruzar vivo... ni muerto.",
                reactions: [
                    { when: { flag: "read_sentence" }, speaker: "Kael'Rin", text: "Conozco la sentencia, Capitán. La leí. Y no recuerdo haberla merecido." },
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Su armadura está tallada con runas de obediencia. No es un hombre: es una orden con forma." },
                ],
                options: [
                    { text: "Desenvainar y atacar.", triggerEnemyId: "temple_guard", nextNodeId: "after" },
                    {
                        text: "Susurrar: “Yo también fui un dios. Arrodíllate.”",
                        when: { minCorruption: 50 },
                        effect: { corruption: 5, sanity: -3 },
                        consequence: "La armadura vacila... pero obedece al Concilio, no a ti.",
                        triggerEnemyId: "temple_guard",
                        nextNodeId: "after",
                    },
                ],
            },
            after: {
                id: "after",
                speaker: "Narrador",
                text: "La armadura se desploma y el resplandor se apaga. Las puertas del bastión se abren con un gemido de siglos. Afuera hay cielo, por primera vez. (Retoma la Historia Principal desde el Hub para continuar.)",
                reactions: [
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Libre... Gracias, Kael'Rin. Aunque aún no sabemos de qué." },
                ],
                setFlags: { ch1_boss_down: true },
                completes: [{ questId: "main_escape_prison", objectiveId: "exit_prison" }],
                options: [{ text: "Salir del bastión", effect: { xp: 30 }, returnToHub: true }],
            },
        },
    },

    // ═══════════════════════ CAPÍTULO 2 ═══════════════════════
    ch2_slums: {
        id: "ch2_slums",
        title: "Barrios Devastados",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "Entre los escombros, siluetas translúcidas se vuelven hacia ti al mismo tiempo. No tienen ojos, pero todas te miran.",
                nextNodeId: "voices",
            },
            voices: {
                id: "voices",
                speaker: "Espíritu de Oakhaven",
                text: "Kael'Rin... tú abriste las puertas esa noche. Tú dejaste entrar la bruma roja.",
                options: [
                    {
                        text: "No recuerdo haberlo hecho. Pero lo siento.",
                        effect: { sanity: 5, celestial: 10, xp: 20 },
                        consequence: "El lamento de los espíritus se aquieta. Uno asiente.",
                        setFlags: { ch2_mourned: true },
                        nextNodeId: "end_mourn",
                    },
                    {
                        text: "Mienten. Fueron los Siete.",
                        effect: { sanity: -5, xp: 15 },
                        setFlags: { ch2_denied: true },
                        nextNodeId: "end_deny",
                    },
                    {
                        text: "Tomar sus almas: ya no tienen a dónde ir.",
                        effect: { infernal: 20, corruption: 12, xp: 25 },
                        consequence: "Las siluetas gritan sin voz mientras se deshacen en tu palma.",
                        setFlags: { ch2_devoured: true },
                        nextNodeId: "end_devour",
                    },
                ],
            },
            end_mourn: {
                id: "end_mourn",
                speaker: "Narrador",
                text: "Antes de desvanecerse, un espíritu señala al norte: “El santuario de Veríana aún guarda la verdad.”",
                reactions: [
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Que la luz los reciba. Hiciste bien en no apartar la mirada." },
                    { when: { companion: "kaelen" }, speaker: "Kaelen", text: "Qué sentimental. Me gusta." },
                ],
            },
            end_deny: {
                id: "end_deny",
                speaker: "Narrador",
                text: "Los espíritus se disuelven en silencio. Quedan sus ojos vacíos en tu memoria. No sabes si dijiste la verdad.",
                reactions: [
                    { when: { companion: "kaelen" }, speaker: "Kaelen", text: "Los muertos no mienten. Los vivos sí. ¿Cuál eres tú ahora?" },
                ],
            },
            end_devour: {
                id: "end_devour",
                speaker: "Narrador",
                text: "Sientes el poder fluyendo... y el vacío que deja. Al norte se ve la luz de un santuario.",
                reactions: [
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Eso no era tuyo, Kael'Rin. Esas almas merecían descanso." },
                    { when: { companion: "kaelen" }, speaker: "Kaelen", text: "Eficiente. Sucio. Seguramente funcione." },
                ],
            },
        },
    },

    ch2_camp: {
        id: "ch2_camp",
        title: "Archivo Real de Oakhaven",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "Entre estantes calcinados, la hoguera del archivo es el único calor de Oakhaven. Anotas lo que sabes en un cuaderno viejo: la sentencia, la bruma roja, los Siete. Las piezas aún no encajan.",
                reactions: [
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Si caes, Kael'Rin, ¿qué quieres que recuerden de ti?" },
                    { when: { companion: "kaelen" }, speaker: "Kaelen", text: "Dormiré con un ojo abierto. No es desconfianza, es costumbre." },
                ],
                options: [
                    { text: "Descansar en silencio", effect: { sanity: 5 }, nextNodeId: "end" },
                    {
                        text: "Estudiar los libros quemados",
                        effect: { xp: 25 },
                        consequence: "Entre las cenizas queda una página legible sobre los Siete.",
                        nextNodeId: "end",
                    },
                ],
            },
            end: {
                id: "end",
                speaker: "Narrador",
                text: "Antes del amanecer, el archivo vuelve a quedarse en silencio. Hay camino por delante.",
            },
        },
    },

    ch2_veriana: {
        id: "ch2_veriana",
        title: "Santuario de Veríana",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "El santuario es una nave de libros que flotan en silencio. Veríana aguarda sentada, como quien ha esperado siglos.",
                nextNodeId: "v1",
            },
            v1: {
                id: "v1",
                speaker: "Veríana la Archivista",
                text: "El Concilio pudo borrar tu nombre, Kael'Rin, pero no sus propios archivos. Mira.",
                nextNodeId: "v2",
            },
            v2: {
                id: "v2",
                speaker: "Veríana la Archivista",
                text: "Esa noche en Oakhaven no abriste las puertas a la bruma. Las cerraste con tu propio poder. Y los Siete te castigaron por ello.",
                variants: [
                    {
                        when: { flag: "ch2_devoured" },
                        text: "Esa noche cerraste las puertas a la bruma. Y hoy has devorado a los mismos que salvaste. La bruma te sigue, Kael'Rin: no por el pasado, sino por lo que eliges ahora.",
                    },
                ],
                options: [
                    { text: "Ya no me importa el pasado. Quiero la Aguja.", effect: { corruption: 3 }, nextNodeId: "v3" },
                    {
                        text: "Quiero saber toda la verdad.",
                        effect: { sanity: 5, xp: 20 },
                        setFlags: { seeks_truth: true },
                        nextNodeId: "v3",
                    },
                ],
            },
            v3: {
                id: "v3",
                speaker: "Narrador",
                text: "Una sombra se despega del techo y aterriza sin ruido a tu lado.",
                nextNodeId: "k1",
            },
            k1: {
                id: "k1",
                speaker: "Kaelen",
                text: "Veríana, ¿esta es la gran esperanza? Parece que le han robado hasta la cara.",
                nextNodeId: "k2",
            },
            k2: {
                id: "k2",
                speaker: "Veríana la Archivista",
                text: "Kaelen ha cazado a tres Archiduques por su cuenta. Mal humor, buena puntería. Convéncelo, si puedes.",
                options: [
                    {
                        text: "El Archiduque mató a tu gente. Yo quiero su cabeza.",
                        effect: { corruption: 3 },
                        setFlags: { kaelen_revenge: true },
                        nextNodeId: "k_join",
                    },
                    {
                        text: "Necesito a alguien que me cubra la espalda.",
                        effect: { xp: 10 },
                        setFlags: { kaelen_trust: true },
                        nextNodeId: "k_join",
                    },
                    {
                        text: "Ambos servimos a nuestras propias sombras.",
                        when: { minCorruption: 40 },
                        effect: { infernal: 5 },
                        nextNodeId: "k_join",
                    },
                ],
            },
            k_join: {
                id: "k_join",
                speaker: "Kaelen",
                text: "Cabeza, espalda, sombras... Me convences. Pero si me traicionas, Dios caído, descubrirás qué se siente al ser clavado en la oscuridad.",
                variants: [
                    { when: { flag: "kaelen_trust" }, text: "Una espalda que cubrir. Hace años que nadie me pide eso. Vamos." },
                ],
                nextNodeId: "recruit",
            },
            recruit: {
                id: "recruit",
                speaker: "Narrador",
                text: "🗡️ Kaelen, Garra Nocturna, se une a tu grupo. Veríana te entrega un mapa de la Ciudadela del Archiduque.",
                reactions: [
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Hay hombres que sirven a la luz sin saberlo. Quizá él sea uno." },
                ],
                recruitCompanion: "kaelen",
                completes: [
                    { questId: "main_reach_oakhaven", objectiveId: "meet_veriana" },
                    { questId: "comp_find_kaelen", objectiveId: "recruit_kaelen" },
                ],
            },
        },
    },

    ch2_citadel: {
        id: "ch2_citadel",
        title: "Ciudadela del Archiduque",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "La Ciudadela respira bruma carmesí. En el trono, el Archiduque Abisal sostiene el Fragmento de la Aguja como una copa de vino.",
                nextNodeId: "taunt",
            },
            taunt: {
                id: "taunt",
                speaker: "Archiduque Abisal",
                text: "¡Kael'Rin! El traidor regresa a casa. ¿Vienes a pedir perdón... o a morir de rodillas?",
                variants: [
                    { when: { flag: "ch2_path_light" }, text: "Qué luz tan molesta traes contigo, mortal. Huele a esperanza. Apestoso." },
                    { when: { flag: "ch2_path_dark" }, text: "Oh... traes oscuridad en las venas. Podríamos haber sido socios, Kael'Rin." },
                ],
                reactions: [
                    { when: { companion: "kaelen" }, speaker: "Kaelen", text: "Qué bocaza para alguien con tan poca defensa mágica." },
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Su bruma se alimenta del miedo. No se lo des." },
                ],
                options: [
                    { text: "Luchar.", triggerEnemyId: "archduke_abyssal", nextNodeId: "after" },
                    {
                        text: "“Entrégame el Fragmento. Seré tu socio.”",
                        when: { flag: "ch2_path_dark" },
                        effect: { corruption: 5 },
                        consequence: "El Archiduque ríe: “Los socios no sangran, Kael'Rin.” El combate estalla.",
                        triggerEnemyId: "archduke_abyssal",
                        nextNodeId: "after",
                    },
                ],
            },
            after: {
                id: "after",
                speaker: "Narrador",
                text: "El Archiduque se deshace en cenizas. El Fragmento de la Aguja resplandece en tus manos y, al norte, el cielo se abre. (Retoma la Historia Principal desde el Hub para continuar.)",
                reactions: [
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Siento algo mirándonos desde arriba. Algo muy antiguo." },
                ],
                setFlags: { ch2_boss_down: true },
                completes: [{ questId: "main_reach_oakhaven", objectiveId: "defeat_archduke" }],
                options: [{ text: "Salir de la Ciudadela", effect: { xp: 40 }, returnToHub: true }],
            },
        },
    },

    // ═══════════════════════ CAPÍTULO 3 ═══════════════════════
    ch3_memories: {
        id: "ch3_memories",
        title: "Galería de las Memorias Divinas",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "Cristales colgantes reflejan una versión de ti que no recuerdas: más alto, coronado de luz, de pie ante seis figuras sentadas.",
                nextNodeId: "v1",
            },
            v1: {
                id: "v1",
                speaker: "Narrador",
                text: "En el último cristal, tu reflejo levanta una mano. Seis dioses caen de rodillas. El séptimo, tú, llora.",
                nextNodeId: "choice",
            },
            choice: {
                id: "choice",
                speaker: "Los Cristales",
                text: "Tómalo, Kael'Rin. Es tuyo.",
                options: [
                    {
                        text: "Aceptar el recuerdo completo.",
                        effect: { sanity: -10, magical_strength: 3, xp: 40 },
                        consequence: "Dolor... y memoria.",
                        setFlags: { accepted_past: true },
                        nextNodeId: "end_accept",
                    },
                    {
                        text: "Romper los cristales. No quiero ser él.",
                        effect: { corruption: 8, sanity: 5, xp: 20 },
                        consequence: "Los cristales estallan. Una parte de ti queda atrás, entre las ruinas.",
                        setFlags: { denied_past: true },
                        nextNodeId: "end_deny",
                    },
                    {
                        text: "Pedir a Lyra que te acompañe en la visión.",
                        when: { companion: "lyra" },
                        effect: { sanity: 5, celestial: 10, xp: 30 },
                        consequence: "La luz de Lyra amortigua el dolor.",
                        setFlags: { accepted_past: true, shared_past: true },
                        nextNodeId: "end_share",
                    },
                ],
            },
            end_accept: {
                id: "end_accept",
                speaker: "Narrador",
                text: "Recuerdas: no fuiste traidor por ambición. Sellaste el poder de los Siete para que no destruyeran el mundo que se disputaban. Y pagaste con tu nombre.",
                reactions: [
                    { when: { companion: "kaelen" }, speaker: "Kaelen", text: "Entonces estamos del lado del loco que quiso salvarnos. Perfecto." },
                ],
            },
            end_deny: {
                id: "end_deny",
                speaker: "Narrador",
                text: "No recuerdas nada nuevo. Pero sientes el vacío exacto donde debería haber una verdad.",
                reactions: [
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Huir del recuerdo no lo borra, Kael'Rin. Solo lo vuelve más pesado." },
                ],
            },
            end_share: {
                id: "end_share",
                speaker: "Lyra",
                text: "Esta vez no estás solo viéndolo. Recuerdas lo suficiente para entender por qué los Siete te temían... y por qué no deberías temerte tú.",
            },
        },
    },

    ch3_camp: {
        id: "ch3_camp",
        title: "Capilla del Último Reposo",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "La Capilla es la única sala de la Aguja donde no cuelgan banderas de ningún dios. Te sientas junto al altar vacío. El silencio pesa más que el miedo: estás cerca del final.",
                reactions: [
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Sea cual sea la elección que hagas allá arriba, no la hagas por culpa." },
                    { when: { companion: "kaelen" }, speaker: "Kaelen", text: "Si vamos a morir, prefiero hacerlo sabiendo qué elegiste tú." },
                ],
                options: [
                    { text: "Descansar.", effect: { sanity: 5 }, nextNodeId: "end" },
                    {
                        text: "Meditar sobre la elección que viene.",
                        effect: { xp: 25 },
                        nextNodeId: "end",
                    },
                ],
            },
            end: {
                id: "end",
                speaker: "Narrador",
                text: "Los ecos de la Aguja se apagan por un momento.",
            },
        },
    },

    ch3_vaelen: {
        id: "ch3_vaelen",
        title: "Torre del Guerrero Sin Causa",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "En lo alto de una torre sin puertas, un guerrero de armadura de bronce mira el horizonte con una espada clavada ante él.",
                nextNodeId: "v1",
            },
            v1: {
                id: "v1",
                speaker: "Vaelen",
                text: "Llevo siglos esperando una orden que valga la pena obedecer. Pregúntame por qué sigo vivo y te diré: por costumbre.",
                nextNodeId: "v2",
            },
            v2: {
                id: "v2",
                speaker: "Vaelen",
                text: "Tú. Dios sin nombre. ¿Qué me ofreces: una causa o una cadena?",
                options: [
                    {
                        text: "Una causa: proteger a quienes no pueden defenderse.",
                        effect: { sanity: 5, xp: 20 },
                        setFlags: { vaelen_protect: true },
                        nextNodeId: "join",
                    },
                    {
                        text: "Una venganza contra quienes te usaron.",
                        effect: { corruption: 5, xp: 20 },
                        setFlags: { vaelen_vengeance: true },
                        nextNodeId: "join",
                    },
                    {
                        text: "Libertad: elegir por ti mismo, incluso contra mí.",
                        effect: { stability: 5, xp: 25 },
                        setFlags: { vaelen_free: true },
                        nextNodeId: "join",
                    },
                ],
            },
            join: {
                id: "join",
                speaker: "Vaelen",
                text: "Proteger... sí. Eso sí lo reconozco. Mi escudo es tuyo.",
                variants: [
                    { when: { flag: "vaelen_vengeance" }, text: "Venganza. Honesta, al menos. Mi espada es tuya." },
                    { when: { flag: "vaelen_free" }, text: "Elegir, incluso contra ti. Qué idea tan peligrosa. Me gusta. Voy contigo." },
                ],
                nextNodeId: "recruit",
            },
            recruit: {
                id: "recruit",
                speaker: "Narrador",
                text: "🛡️ Vaelen, El Incombustible, se une a tu grupo.",
                reactions: [
                    { when: { companion: "kaelen" }, speaker: "Kaelen", text: "Qué gran grupo: una sacerdotisa, un asesino y un muro con piernas." },
                ],
                recruitCompanion: "vaelen",
                completes: [{ questId: "comp_find_vaelen", objectiveId: "recruit_vaelen" }],
            },
        },
    },

    ch3_threshold: {
        id: "ch3_threshold",
        title: "Umbral de la Decisión",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "Un arco parte la Aguja en dos corredores: uno de luz blanca, otro de sombra viva. En el centro, un eco te espera.",
                nextNodeId: "echo",
            },
            echo: {
                id: "echo",
                speaker: "Eco Celestial",
                text: "Todo lo que elegiste te trajo hasta aquí. Allá arriba se juzgará quién eres, no quién fuiste.",
                variants: [
                    { when: { minCorruption: 70 }, text: "Veo sombras en tu pecho, Kael'Rin. Aún puedes cruzar... pero ya no lo haces solo." },
                    { when: { minSanity: 75, maxCorruption: 40 }, text: "Tu mente está en calma y tu alma clara. El Juicio Sagrado te reconocerá." },
                ],
                reactions: [
                    { when: { companion: "lyra" }, speaker: "Lyra", text: "Sea cual sea tu camino, caminaré contigo hasta la puerta." },
                    { when: { companion: "vaelen" }, speaker: "Vaelen", text: "Allá arriba no habrá retroceso. Lo sabes." },
                ],
                options: [{ text: "Seguir adelante.", effect: { xp: 30 }, nextNodeId: "end" }],
            },
            end: {
                id: "end",
                speaker: "Narrador",
                text: "Cruzas el umbral.",
            },
        },
    },

    ch3_sanctum: {
        id: "ch3_sanctum",
        title: "Sanctum del Alto Concilio",
        startNodeId: "start",
        nodes: {
            start: {
                id: "start",
                speaker: "Narrador",
                text: "El Sanctum es una sala sin techo, abierta al cielo. Siete tronos de piedra; uno de ellos, roto. El tuyo.",
                nextNodeId: "end",
            },
            end: {
                id: "end",
                speaker: "Narrador",
                text: "La Aguja te reconoce. Es hora de decidir qué eres. (Abre la Historia Principal desde el Hub.)",
                setFlags: { ch3_sanctum: true },
                options: [{ text: "Prepararte para el juicio", returnToHub: true }],
            },
        },
    },
};