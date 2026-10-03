import type { Quest, QuestRef } from "../types/quest.type";

export function completeObjectives(quests: Quest[], refs: QuestRef[]): Quest[] {
    return refs.reduce(
        (qs, { questId, objectiveId }) =>
            qs.map((q) => {
                if (q.id !== questId || q.status === "locked" || q.status === "completed") return q;
                const objectives = q.objectives.map((o) =>
                    o.id === objectiveId ? { ...o, completed: true } : o,
                );
                const done = objectives.every((o) => o.completed);
                return { ...q, objectives, status: done ? ("completed" as const) : q.status };
            }),
        quests,
    );
}