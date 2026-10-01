export type NodeType =
    | "combat"
    | "elite"
    | "boss"
    | "event"
    | "companion"
    | "rest"
    | "shop"
    | "altar"
    | "story";

export interface MapNode {
    id: string;
    /** Row in the map (0 = top, higher = further from start) */
    row: number;
    /** Column position within the row */
    col: number;
    type: NodeType;
    /** Display name for this location */
    name: string;
    /** Short flavor description */
    description: string;
    completed: boolean;
    current: boolean;
    accessible: boolean;
    /** IDs of nodes reachable from here */
    connectedTo: string[];
    enemyId?: string;
    eventId?: string;
    companionId?: string;
    /** Optional quest triggered when visiting this node */
    questId?: string;
}

export interface ChapterMap {
    chapterId: string;
    nodes: MapNode[];
    currentNodeId: string | null;
}
