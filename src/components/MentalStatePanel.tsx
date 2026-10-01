import { getCorruptionEffects, getSanityEffects } from "../utils/mental-effects";
import type { Stats } from "../types/player.type";

interface Props {
    stats: Stats;
}

export function MentalStatePanel({ stats }: Props) {
    const corrEff = getCorruptionEffects(stats.corruption);
    const sanEff = getSanityEffects(stats.sanity);

    const corruptionColor =
        stats.corruption >= 70 ? "#E24B4A" :
        stats.corruption >= 50 ? "#EF9F27" :
        stats.corruption <= 10 ? "#5DCAA5" : "#888";

    const sanityColor =
        stats.sanity <= 30 ? "#E24B4A" :
        stats.sanity <= 50 ? "#EF9F27" : "#5DCAA5";

    return (
        <div style={container}>
            <div style={header}>⚖️ Estado Mental</div>

            {/* Corruption */}
            <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                    <span style={{ color: corruptionColor }}>Corrupción del alma</span>
                    <span style={{ color: corruptionColor, fontWeight: 600 }}>{stats.corruption}%</span>
                </div>
                <div style={{ height: 6, background: "#0d0d1a", borderRadius: 3 }}>
                    <div style={{ width: `${stats.corruption}%`, height: "100%", background: corruptionColor, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
                {corrEff.statusMessage && (
                    <div style={{ fontSize: 10, color: corruptionColor, marginTop: 4, fontStyle: "italic" }}>
                        {corrEff.statusMessage}
                    </div>
                )}
                {corrEff.statModifier && Object.keys(corrEff.statModifier).length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {Object.entries(corrEff.statModifier).map(([key, val]) => (
                            <span key={key} style={{ fontSize: 9, background: "#12122a", border: `1px solid ${(val as number) > 0 ? "#5DCAA5" : "#E24B4A"}33`, color: (val as number) > 0 ? "#5DCAA5" : "#E24B4A", padding: "1px 5px", borderRadius: 3 }}>
                                {(val as number) > 0 ? "+" : ""}{val} {statLabel(key)}
                            </span>
                        ))}
                    </div>
                )}
                {corrEff.darkVoice && (
                    <div style={{ fontSize: 10, color: "#7F77DD", marginTop: 4, fontStyle: "italic", borderLeft: "2px solid #7F77DD44", paddingLeft: 6 }}>
                        "{corrEff.darkVoice}"
                    </div>
                )}
            </div>

            {/* Sanity */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 3 }}>
                    <span style={{ color: sanityColor }}>Cordura</span>
                    <span style={{ color: sanityColor, fontWeight: 600 }}>{stats.sanity}%</span>
                </div>
                <div style={{ height: 6, background: "#0d0d1a", borderRadius: 3 }}>
                    <div style={{ width: `${stats.sanity}%`, height: "100%", background: sanityColor, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
                {sanEff.message && (
                    <div style={{ fontSize: 10, color: sanityColor, marginTop: 4, fontStyle: "italic" }}>
                        {sanEff.message}
                    </div>
                )}
                {sanEff.missChance > 0 && (
                    <div style={{ fontSize: 10, color: "#EF9F27", marginTop: 2 }}>
                        ⚠️ {Math.round(sanEff.missChance * 100)}% de fallo en acciones de combate
                    </div>
                )}
            </div>
        </div>
    );
}

function statLabel(key: string): string {
    const map: Record<string, string> = {
        magical_strength: "F.Mág",
        physical_strength: "F.Fís",
        resistance: "Res",
        magicResistance: "Res.Mág",
        speed: "Vel",
        sanity: "Cordura",
    };
    return map[key] ?? key;
}

const container: React.CSSProperties = {
    background: "#12122a",
    border: "1px solid #1a1a2e",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
};

const header: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#555",
    marginBottom: 10,
    borderBottom: "1px solid #1a1a2e",
    paddingBottom: 6,
};