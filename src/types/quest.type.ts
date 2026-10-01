export type QuestStatus = "active" | "completed" | "failed" | "locked";
export type QuestCategory = "main" | "secondary" | "exploration" | "companion";

export interface QuestObjective {
    id: string;
    description: string;
    completed: boolean;
    /** optional: which chapter/location unlocks this objective */
    unlockedAtChapter?: string;
    unlockedAtLocation?: string;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    category: QuestCategory;
    status: QuestStatus;
    icon: string;
    objectives: QuestObjective[];
    reward?: {
        xp?: number;
        gold?: number;
        itemId?: string;
        spellId?: string;
        description: string;
    };
    /** which chapter this quest belongs to / is given in */
    chapterId: string;
    /** optional location id that grants this quest */
    triggeredByLocation?: string;
    /** optional companion id this quest is about */
    companionId?: string;
}
