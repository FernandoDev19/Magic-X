import { useEffect, useRef, useState } from "react";

interface Props {
    className?: string;
    log: string[];
    round: number;
    turn: "player" | "enemy";
}

const LINE_COLORS: { test: (s: string) => boolean; color: string; bg?: string; bold?: boolean }[] = [
    { test: s => s.includes("⚠️ FASE"), color: "#ff9a3c", bold: true, bg: "#2a1405" },
    { test: s => s.includes("DEBILIDAD"), color: "#FAC775", bold: true },
    { test: s => s.includes("Victoria") || s.includes("victoria") || s.includes("--- Victoria"), color: "#4ae286", bold: true, bg: "#0a2a15" },
    { test: s => s.includes("caído") || s.includes("muere") || s.includes("derrota") || s.includes("Has caído"), color: "#E24B4A", bold: true },
    { test: s => s.includes("Turno enemigo"), color: "#e24b4a66", bold: true },
    { test: s => s.includes("--- Turno") || s.includes("Ronda"), color: "#7F77DD", bold: true },
    { test: s => (s.includes("daño") || s.includes("→")) && !s.includes("recuperas"), color: "#F09595" },
    { test: s => s.includes("recuperas") || s.includes("sana") || s.includes("PV") && s.includes("+"), color: "#5DCAA5" },
    { test: s => s.includes("💧") || s.includes("Maná") && s.includes("+"), color: "#378ADD" },
    { test: s => s.includes("🔥") || s.includes("burning") || s.includes("fuego") || s.includes("Fuego"), color: "#EF9F27" },
    { test: s => s.includes("maldición") || s.includes("cursed") || s.includes("poisoned") || s.includes("veneno"), color: "#AFA9EC" },
    { test: s => s.includes("paralyzed") || s.includes("frozen"), color: "#85B7EB" },
    { test: s => s.includes("💰") || s.includes("Oro") || s.includes("Obtienes"), color: "#FAC775" },
    { test: s => s.includes("⚔️") || s.includes("compañero") || s.includes("Lyra") || s.includes("Kaelen") || s.includes("Vaelen"), color: "#c9a84c" },
    { test: s => s.includes("🔄") || s.includes("Refrescado"), color: "#8ab4f8" },
];

export function getLineStyle(line: string): React.CSSProperties {
    for (const rule of LINE_COLORS) {
        if (rule.test(line)) {
            return {
                color: rule.color,
                fontWeight: rule.bold ? 700 : 400,
                background: rule.bg ?? "transparent",
                borderRadius: rule.bg ? 3 : 0,
                padding: rule.bg ? "2px 4px" : "0",
            };
        }
    }
    return { color: "#c0c0c0" };
}

export function CombatLog({ className, log, round, turn }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [lastCount, setLastCount] = useState(log.length);
    const [isFlashing, setIsFlashing] = useState(false);

    useEffect(() => {
        if (log.length !== lastCount) {
            setLastCount(log.length);
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), 400);
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
        }
    }, [log, lastCount]);

    const lastLine = log[log.length - 1] ?? null;

    return (
        <div className={className || ""} style={{
            background: "#08080f",
            border: `2px solid ${isFlashing ? "#c9a84c88" : "#1a1a2e"}`,
            borderRadius: 10,
            overflow: "hidden",
            transition: "border-color 0.3s ease",
            boxShadow: isFlashing ? "0 0 12px rgba(201,168,76,0.3)" : "none",
        }}>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "7px 14px",
                background: "#0d0d1a",
                borderBottom: "1px solid #1a1a2e",
            }}>
                <span style={{ color: "#c9a84c", fontSize: 10, letterSpacing: 2 }}>
                    ⚔️ REGISTRO DE BATALLA — RONDA {round}
                </span>
                <span style={{
                    fontSize: 10,
                    padding: "2px 10px",
                    borderRadius: 4,
                    background: turn === "player" ? "#1D9E7522" : "#E24B4A22",
                    color: turn === "player" ? "#5DCAA5" : "#E24B4A",
                    border: `1px solid ${turn === "player" ? "#1D9E7555" : "#E24B4A55"}`,
                    fontWeight: 700,
                    letterSpacing: 1,
                    transition: "all 0.3s",
                }}>
                    {turn === "player" ? "🟢 TU TURNO" : "🔴 TURNO ENEMIGO"}
                </span>
            </div>

            {/* Last action BANNER — most prominent */}
            {lastLine && (
                <div style={{
                    padding: "10px 14px",
                    background: "#12122a",
                    borderBottom: "1px solid #1a1a2e",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minHeight: 40,
                    transition: "all 0.25s",
                }}>
                    <span style={{ fontSize: 11, color: "#555", flexShrink: 0 }}>Última acción:</span>
                    <span style={{
                        fontSize: 13,
                        fontFamily: "Georgia, serif",
                        fontWeight: 600,
                        lineHeight: 1.4,
                        ...getLineStyle(lastLine),
                    }}>
                        {lastLine}
                    </span>
                </div>
            )}

            {/* Scrollable log — last N entries */}
            <div ref={scrollRef} style={{
                maxHeight: 140,
                overflowY: "auto",
                padding: "8px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
            }}>
                {log.length === 0 ? (
                    <div style={{ color: "#444", fontStyle: "italic", fontSize: 11 }}>
                        El combate comienza…
                    </div>
                ) : (
                    log.map((line, i) => {
                        const isLast = i === log.length - 1;
                        const style = getLineStyle(line);
                        return (
                            <div
                                key={i}
                                style={{
                                    fontSize: isLast ? 12 : 10,
                                    lineHeight: 1.5,
                                    fontFamily: "Georgia, serif",
                                    opacity: isLast ? 1 : Math.max(0.35, 1 - (log.length - 1 - i) * 0.12),
                                    display: "flex",
                                    gap: 6,
                                    alignItems: "flex-start",
                                    ...style,
                                }}
                            >
                                <span style={{ color: "#333", fontSize: 9, flexShrink: 0, marginTop: 2 }}>
                                    {i + 1}.
                                </span>
                                <span>{line}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}