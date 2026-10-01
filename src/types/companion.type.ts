import type { Stats, Mana, Role } from "./player.type";
import type { Spell } from "./spell.type";
import type { Skill } from "./skills.type";

export interface Companion {
    id: string;
    name: string;
    title: string;
    role: Role;
    avatar: string;
    description: string;
    stats: Stats;
    mana: Mana;
    spells: Spell[];
    skills: Skill[];
    isRecruited: boolean;
    isActive: boolean;
    unlockedAtChapter?: string;
}
