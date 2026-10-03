import type { GameState } from "../types/game-state";

const ELEMENT_ICON: Record<string, string> = {
    fire: "🔥", earth: "🪨", water: "💧", air: "🌪",
    light: "✨", darkness: "🌑", electric: "⚡", vital: "💛",
};

export function TurnOrderBar({ state, compact = false }: { state: GameState; compact?: boolean }) {
    const { order, turnIdx, enemies, round } = state.combat;
    const party = state.player.party ?? [];

    const entries = order
        .map((a, i) => {
            if (a.kind === "player") return { key: "player", icon: "⚡", label: "Tú", alive: true, i, color: "#c9a84c" };
            if (a.kind === "companion") {
                const c = party.find((x) => x.id === a.id);
                return { key: a.id, icon: c?.avatar ?? "👤", label: c?.name ?? "?", alive: (c?.stats.hp ?? 0) > 0, i, color: "#5DCAA5" };
            }
            const e = enemies[a.idx];
            return { key: `e${a.idx}`, icon: e ? ELEMENT_ICON[e.element] : "?", label: e?.name ?? "?", alive: !!e && e.hp > 0, i, color: "#E24B4A" };
        })
        .filter((x) => x.alive);

    if (entries.length === 0) return null;

    const chips = (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            {compact && <span style={{ fontSize: 9, color: "#666", letterSpacing: 1 }}>ORDEN</span>}
            {entries.map((x) => {
                const current = x.i === turnIdx;
                const done = x.i < turnIdx;
                return (
                    <div
                        key={x.key}
                        title={x.label}
                        style={{
                            display: "flex", alignItems: "center", gap: 3,
                            padding: compact ? "1px 6px" : "3px 8px", borderRadius: 5,
                            fontSize: compact ? 9 : 10,
                            background: current ? `${x.color}22` : "#0d0d1a",
                            border: `1px solid ${current ? x.color : "#222"}`,
                            color: current ? x.color : "#888",
                            opacity: done ? 0.35 : 1,
                            transition: "all 0.2s",
                        }}
                    >
                        <span style={{ fontSize: compact ? 11 : 13 }}>{x.icon}</span>
                        {!compact && <span>{x.label}</span>}
                    </div>
                );
            })}
        </div>
    );

    if (compact) return chips;

    return (
        <div style={{ background: "#12122a", border: "1px solid #1a1a2e", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 10, color: "#666", letterSpacing: 1.5, marginBottom: 6 }}>
                INICIATIVA — Ronda {round}
            </div>
            {chips}
        </div>
    );
}