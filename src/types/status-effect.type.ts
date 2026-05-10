export type StatusEffectType =
    | "ignition" // fuego: daño continuo
    | "frozen" // agua: no puede actuar
    | "paralyzed" // eléctrico: salta turno
    | "slowed" // agua: velocidad -50%
    | "poisoned" // oscuridad: daño y debilita
    | "blinded" // luz: falla ataques
    | "weakened" // oscuridad: stats reducidos
    | "strengthened" // vital: stats aumentados
    | "invisible" // aire: enemigos no pueden atacar
    | "cursed" // oscuridad: penalización progresiva
    | "burning" // fuego+oscuridad: Amaterasu, no se apaga
    | "mana_drain" // oscuridad: pierde maná por turno
    | "velocitized"; //vital: velocidad aumentada

export interface StatusEffect {
    type: StatusEffectType;
    duration: number;
    value?: number;
    permanent?: boolean; // para Amaterasu
}
