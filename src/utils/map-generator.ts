import type { ChapterMap, MapNode } from "../types/map.type";

// ─────────────────────────────────────────────────────────────────────────────
// Chapter 1: The Prison and its Surroundings
// ─────────────────────────────────────────────────────────────────────────────
function buildChapter1Map(): ChapterMap {
  const nodes: MapNode[] = [
    // Row 0 – Starting point
    {
      id: "ch1_cell",
      row: 0,
      col: 1,
      type: "story",
      name: "Celda de la Mazmorra",
      description:
        "Tu punto de partida. Las cadenas rúnicas cedieron. La oscuridad te recibe.",
      completed: true,
      current: false,
      accessible: true,
      connectedTo: ["ch1_corridor"],
    },
    // Row 1 – First branch
    {
      id: "ch1_corridor",
      row: 1,
      col: 1,
      type: "combat",
      name: "Pasillo del Bastión",
      description:
        "Bandidos al servicio del Concilio patrullan este corredor húmedo.",
      completed: false,
      current: true,
      accessible: true,
      connectedTo: ["ch1_torture_chamber", "ch1_prison_courtyard"],
      enemyId: "bandit",
      questId: "side_strength_trial",
      completes: [
        { questId: "side_strength_trial", objectiveId: "kill_bandits" },
      ],
    },
    // Row 2 – Multiple paths
    {
      id: "ch1_torture_chamber",
      row: 2,
      col: 0,
      type: "event",
      name: "Cámara de Tortura",
      description:
        "Instrumentos herrumbrados y pergaminos prohibidos esparcidos por doquier.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch1_altar_runes", "ch1_armory"],
      questId: "side_explore_ruins",
      sceneId: "ch1_torture",
      completes: [
        { questId: "side_explore_ruins", objectiveId: "find_scrolls" },
      ],
    },
    {
      id: "ch1_prison_courtyard",
      row: 2,
      col: 2,
      type: "rest",
      name: "Patio Interior",
      description:
        "Una hoguera encendida por prisioneros olvidados. Momentáneo refugio.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch1_armory", "ch1_ally_hideout"],
      questId: "exp_first_rest",
      sceneId: "ch1_campfire",
      completes: [{ questId: "exp_first_rest", objectiveId: "use_campfire" }],
    },
    // Row 3 – Varied
    {
      id: "ch1_altar_runes",
      row: 3,
      col: 0,
      type: "altar",
      name: "Altar de las Runas Prohibidas",
      description: "Un altar ancestral vibra con energía de los dioses caídos.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch1_outer_gate"],
      questId: "exp_altar_duality",
      completes: [
        { questId: "exp_altar_duality", objectiveId: "visit_altar" },
        { questId: "side_explore_ruins", objectiveId: "read_runes" },
      ],
    },
    {
      id: "ch1_armory",
      row: 3,
      col: 1,
      type: "shop",
      name: "Armería Abandonada",
      description:
        "Un mercader errante convirtió el arsenal del Concilio en su tienda.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch1_outer_gate"],
    },
    {
      id: "ch1_ally_hideout",
      row: 3,
      col: 2,
      type: "companion",
      name: "Refugio Secreto de Lyra",
      description:
        "Una sacerdotisa exiliada se esconde aquí. Sus ojos brillan con luz celestial.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch1_outer_gate"],
      companionId: "lyra",
      questId: "comp_find_lyra",
      sceneId: "ch1_lyra",
      completes: [{ questId: "comp_find_lyra", objectiveId: "find_lyra_loc" }],
    },
    // Row 4 – Elite before boss
    {
      id: "ch1_outer_gate",
      row: 4,
      col: 1,
      type: "elite",
      name: "Puerta Exterior del Bastión",
      description:
        "Un Lobo Alfa maldito custodia la salida hacia las tierras libres.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch1_boss"],
      enemyId: "wolf",
      questId: "side_strength_trial",
      completes: [
        { questId: "side_strength_trial", objectiveId: "kill_wolves" },
        { questId: "side_strength_trial", objectiveId: "kill_elite" },
      ],
    },
    // Row 5 – Boss
    {
      id: "ch1_boss",
      row: 5,
      col: 1,
      type: "boss",
      name: "Sala del Capitán del Concilio",
      description:
        "El Guardia del Templo protege la salida al mundo exterior. Derrótalo para ser libre.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: [],
      enemyId: "temple_guard",
      questId: "main_escape_prison",
      sceneId: "ch1_boss",
    },
  ];

  return { chapterId: "ch1", nodes, currentNodeId: "ch1_corridor" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chapter 2: The Fallen Kingdom of Oakhaven
// ─────────────────────────────────────────────────────────────────────────────
function buildChapter2Map(): ChapterMap {
  const nodes: MapNode[] = [
    {
      id: "ch2_gate",
      row: 0,
      col: 1,
      type: "story",
      name: "Portales de Oakhaven",
      description:
        "Entras por los arcos rotos de la vieja metrópoli. La niebla carmesí te recibe.",
      completed: true,
      current: false,
      accessible: true,
      connectedTo: ["ch2_plaza", "ch2_slums"],
    },
    {
      id: "ch2_plaza",
      row: 1,
      col: 0,
      type: "combat",
      name: "Plaza Central en Ruinas",
      description: "Asesinos de sombras acechan entre las columnas caídas.",
      completed: false,
      current: true,
      accessible: true,
      connectedTo: ["ch2_archive", "ch2_market"],
      enemyId: "shadow_assassin",
    },
    {
      id: "ch2_slums",
      row: 1,
      col: 2,
      type: "event",
      name: "Barrios Devastados",
      description:
        "Entre los escombros, los espíritus de ciudadanos hablan de la traición de Kael'Rin.",
      completed: false,
      current: false,
      accessible: true,
      connectedTo: ["ch2_market", "ch2_catacombs"],
      questId: "side_oakhaven_memories",
      sceneId: "ch2_slums",
      completes: [
        { questId: "side_oakhaven_memories", objectiveId: "vision_1" },
      ],
    },
    {
      id: "ch2_archive",
      row: 2,
      col: 0,
      type: "rest",
      name: "Archivo Real de Oakhaven",
      description:
        "El archivo real, aún en pie. Sus hogueras son el único calor en la ciudad muerta.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch2_veriana"],
      sceneId: "ch2_camp",
    },
    {
      id: "ch2_market",
      row: 2,
      col: 1,
      type: "shop",
      name: "Mercado Maldito",
      description: "Un mercader que comercia con las almas de los caídos.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch2_veriana", "ch2_altar"],
      questId: "side_oakhaven_memories",
      completes: [
        { questId: "side_oakhaven_memories", objectiveId: "visit_shop_ch2" },
      ],
    },
    {
      id: "ch2_catacombs",
      row: 2,
      col: 2,
      type: "elite",
      name: "Catacumbas del Rey Caído",
      description:
        "El Draco de Fuego duerme sobre los restos del último rey de Oakhaven.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch2_altar"],
      enemyId: "fire_drake",
    },
    {
      id: "ch2_veriana",
      row: 3,
      col: 0,
      type: "companion",
      name: "Santuario de Veríana",
      description: "La archivista te espera con memorias de tu pasado divino.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch2_citadel"],
      companionId: "kaelen",
      questId: "comp_find_kaelen",
      sceneId: "ch2_veriana",
      completes: [
        { questId: "comp_find_kaelen", objectiveId: "find_kaelen_loc" },
      ],
    },
    {
      id: "ch2_altar",
      row: 3,
      col: 2,
      type: "altar",
      name: "Altar del Dios Abisal",
      description:
        "El altar oscuro pulsa con el poder de los Señores Abisales encadenados.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch2_citadel"],
    },
    {
      id: "ch2_citadel",
      row: 4,
      col: 1,
      type: "boss",
      name: "Ciudadela del Archiduque",
      description:
        "El Archiduque Abisal aguarda. Custodia el Fragmento de la Aguja con su propia existencia.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: [],
      enemyId: "archduke_abyssal",
      questId: "main_reach_oakhaven",
      sceneId: "ch2_citadel",
    },
  ];

  return { chapterId: "ch2", nodes, currentNodeId: "ch2_plaza" };
}

// ─────────────────────────────────────────────────────────────────────────────
// Chapter 3: The Eternal Spire
// ─────────────────────────────────────────────────────────────────────────────
function buildChapter3Map(): ChapterMap {
  const nodes: MapNode[] = [
    {
      id: "ch3_base",
      row: 0,
      col: 1,
      type: "story",
      name: "Base de la Aguja",
      description:
        "La Aguja se alza hasta las nubes. El peso del destino se siente en cada paso.",
      completed: true,
      current: false,
      accessible: true,
      connectedTo: ["ch3_level1_left", "ch3_level1_right"],
    },
    {
      id: "ch3_level1_left",
      row: 1,
      col: 0,
      type: "combat",
      name: "Cámara de los Caballeros Corruptos",
      description:
        "Caballeros que juraron lealtad a los Siete Dioses defienden cada nivel.",
      completed: false,
      current: true,
      accessible: true,
      connectedTo: ["ch3_rest", "ch3_shop"],
      enemyId: "corrupted_knight",
    },
    {
      id: "ch3_level1_right",
      row: 1,
      col: 2,
      type: "event",
      name: "Galería de las Memorias Divinas",
      description:
        "Visiones de tu pasado como dios se revelan en este salón de cristal.",
      completed: false,
      current: false,
      accessible: true,
      connectedTo: ["ch3_shop", "ch3_altar"],
      sceneId: "ch3_memories",
    },
    {
      id: "ch3_rest",
      row: 2,
      col: 0,
      type: "rest",
      name: "Capilla del Último Reposo",
      description:
        "La única capilla neutral en la Aguja, respetada por todos los bandos.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch3_vaelen"],
      sceneId: "ch3_camp",
    },
    {
      id: "ch3_shop",
      row: 2,
      col: 1,
      type: "shop",
      name: "Forja de los Mundos",
      description:
        "Un herrero celestial forja armas y pociones con materia estelar.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch3_vaelen", "ch3_altar"],
    },
    {
      id: "ch3_altar",
      row: 2,
      col: 2,
      type: "altar",
      name: "Altar del Primer Dios",
      description:
        "El santuario del primer dios antes del Concilio. La energía pura aún fluye.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch3_chaos_demon"],
    },
    {
      id: "ch3_vaelen",
      row: 3,
      col: 0,
      type: "companion",
      name: "Torre del Guerrero Sin Causa",
      description: "Vaelen espera una razón para luchar. ¿Le darás una?",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch3_penultimate"],
      companionId: "vaelen",
      questId: "comp_find_vaelen",
      sceneId: "ch3_vaelen",
      completes: [
        { questId: "comp_find_vaelen", objectiveId: "find_vaelen_loc" },
      ],
    },
    {
      id: "ch3_chaos_demon",
      row: 3,
      col: 2,
      type: "elite",
      name: "Sala del Demonio del Caos",
      description: "El Demonio del Caos es el guardián del penúltimo nivel.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch3_penultimate"],
      enemyId: "chaos_demon",
    },
    {
      id: "ch3_penultimate",
      row: 4,
      col: 1,
      type: "event",
      name: "Umbral de la Decisión",
      description:
        "Antes de enfrentar al guardián final, el eco del destino te pregunta: ¿qué eleges ser?",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: ["ch3_boss"],
      sceneId: "ch3_threshold",
    },
    {
      id: "ch3_boss",
      row: 5,
      col: 1,
      type: "story",
      name: "Sanctum del Alto Concilio",
      description:
        "El guardián final aguarda. Lo que decidas aquí definirá el mundo.",
      completed: false,
      current: false,
      accessible: false,
      connectedTo: [],
      sceneId: "ch3_sanctum",
    },
  ];

  return { chapterId: "ch3", nodes, currentNodeId: "ch3_level1_left" };
}

export function generateMapForChapter(chapterId: string): ChapterMap {
  if (chapterId === "ch1") return buildChapter1Map();
  if (chapterId === "ch2") return buildChapter2Map();
  if (chapterId === "ch3") return buildChapter3Map();
  return buildChapter1Map();
}
