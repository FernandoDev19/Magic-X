import type { PlayerProfile } from "../types/player.type";

export const PLAYER_PROFILE: PlayerProfile = {
    name: "Kael'Rin",
    title: "Dios renacido",
    type: "mage",
    backstory: `Algo en ti no encaja. No eres como los demás Consus. 
        Sueñas con un mundo que nadie recuerda… y con voces que te llaman traidor. 
        No sabes quién fuiste. Pero algo en tu interior insiste en que… no deberías estar aquí.`,
    baseStats: {
        hp: 100,
        maxHp: 100,
        physical_strength: 10,
        magical_strength: 30,
        speed: 20,
        resistance: 15,
        magicResistance: 10,
        corruption: 50,
        maxCorruption: 100,
        sanity: 100,
        maxSanity: 100,
        stability: 80,
        maxStability: 100,
    },
    baseMana: {
        mana: 100,
        maxMana: 100,
        celestial: 0,
        maxCelestial: 0,
        infernal: 0,
        maxInfernal: 0,
    },
    // Nivel por elemento (0–100). El jugador empieza débil en todo.
    elementLevels: {
        fire: 1,
        earth: 1,
        water: 1,
        air: 1,
        light: 0,
        darkness: 0,
        electric: 1,
        vital: 2,
    },
    // Afinidad: cuánto bono/penalización al coste de maná (0.5 = 50% más barato, 2.0 = doble coste)
    elementAffinity: {
        fire: 0.9,
        earth: 1.2,
        water: 1.3,
        air: 1.2,
        light: 0.8,
        darkness: 1.5,
        electric: 1.1,
        vital: 0.7,
    },
    startingSpellIds: ["vital_buff_1", "vital_buff_2"],
    startingItemIds: [],
    startingEquipmentIds: [],
    startingSkillIds: [],
};
