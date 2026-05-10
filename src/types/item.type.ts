import type { Mana, Stats } from "./player.type";

export interface Item {
    id: string;
    name: string;
    icon: string;
    usable: boolean;
    quantity: number;
    onUse?: (stats: Stats, mana: Mana) => Partial<Stats> & Partial<Mana>;
    description: string;
}

export interface Equipment extends Item {
    slot: "weapon" | "armor" | "accessory";
    stats: (stats: Stats, mana?: Mana) => Partial<Stats> & Partial<Mana>;
}