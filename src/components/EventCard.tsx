import { useEffect, useState } from "react";
import type { StoryNode, StoryOption } from "../types/game-state";
import { BACKGROUNDS, PORTRAITS, USE_IMAGES } from "../data/visuals";
import { Portrait } from "./Portrait";

interface Props {
    node: StoryNode;
    /** Clave de BACKGROUNDS (escena, capítulo o `bg` del nodo) */
    bgKey: string;
    /** Nombres de los aliados presentes (p. ej. ["Lyra", "Kaelen"]) */
    partyNames: string[];
    onChoice: (option: StoryOption) => void;
    onContinue: () => void;
}

function useTypewriter(text: string, cps = 70) {
    const reduced =
        typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const [n, setN] = useState(reduced ? text.length : 0);

    useEffect(() => {
        if (n >= text.length) return;
        const t = setTimeout(() => setN((v) => Math.min(text.length, v + 1)), 1000 / cps);
        return () => clearTimeout(t);
    }, [n, text, cps]);

    return { shown: text.slice(0, n), done: n >= text.length, skip: () => setN(text.length) };
}

function Backdrop({ bgKey }: { bgKey: string }) {
    const [failed, setFailed] = useState(false);
    const bg = BACKGROUNDS[bgKey] ?? BACKGROUNDS.default;
    return (
        <>
            <div style={{ position: "absolute", inset: 0, background: bg.gradient }} />
            {USE_IMAGES && bg.src && !failed && (
                <img
                    src={bg.src}
                    alt=""
                    onError={() => setFailed(true)}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
            )}
            {/* Viñeta para que los retratos y el texto se lean siempre */}
            <div
                style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 40%, #151525 100%)",
                }}
            />
            {bg.label && (
                <div style={styles.place}>📍 {bg.label}</div>
            )}
        </>
    );
}

export function EventCard({ node, bgKey, partyNames, onChoice, onContinue }: Props) {
    const isNarrator = !node.speaker || node.speaker === "Narrador";
    const { shown, done, skip } = useTypewriter(node.text);

    const speakerHasPortrait = !isNarrator && !!PORTRAITS[node.speaker!];
    // A la derecha: Kael'Rin y el grupo, salvo quien habla (que va a la izquierda)
    const others = ["Kael'Rin", ...partyNames].filter((n) => n !== node.speaker && !!PORTRAITS[n]);

    return (
        <div style={styles.card}>
            {/* Escenario */}
            <div style={styles.stage}>
                <Backdrop bgKey={bgKey} />

                {speakerHasPortrait && (
                    <div key={node.speaker} style={styles.speaker}>
                        <Portrait name={node.speaker!} size={150} variant="bust" />
                    </div>
                )}

                <div style={styles.party}>
                    {others.map((n) => (
                        <Portrait key={n} name={n} size={56} variant="bust" dim />
                    ))}
                </div>
            </div>

            {/* Diálogo */}
            <div style={styles.body}>
                <div style={styles.dialogueBox} onClick={skip} title={done ? undefined : "Clic para saltar"}>
                    {!isNarrator && <div style={styles.speakerName}>{node.speaker}</div>}
                    <p style={isNarrator ? styles.narratorText : styles.dialogueText}>
                        {shown}
                        {!done && <span style={{ opacity: 0.5 }}>▌</span>}
                    </p>
                </div>

                {done && node.reactions?.map((r, i) => (
                    <div key={i} style={styles.reaction}>
                        <Portrait name={r.speaker} size={30} />
                        <div>
                            <span style={styles.reactionName}>{r.speaker}:</span> {r.text}
                        </div>
                    </div>
                ))}

                {done && (
                    <div style={styles.options}>
                        {node.options && node.options.length > 0 ? (
                            node.options.map((option, i) => (
                                <button key={i} style={styles.button} onClick={() => onChoice(option)}>
                                    {option.text}
                                </button>
                            ))
                        ) : (
                            <button style={styles.continueButton} onClick={onContinue}>
                                Continuar
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    card: {
        background: "#1a1a2e",
        border: "1px solid #444",
        borderRadius: 8,
        maxWidth: 640,
        margin: "0 auto",
        overflow: "hidden",
        animation: "fadeIn 0.3s ease",
    },
    stage: { position: "relative", height: 220, overflow: "hidden" },
    place: {
        position: "absolute", top: 10, left: 12, fontSize: 10, letterSpacing: 1.5,
        color: "#c9a84ccc", background: "rgba(0,0,0,0.45)", padding: "3px 8px", borderRadius: 4,
    },
    speaker: { position: "absolute", left: 16, bottom: 0, animation: "fadeIn 0.35s ease" },
    party: {
        position: "absolute", right: 14, bottom: 0, display: "flex", alignItems: "flex-end", gap: 8,
    },
    body: { padding: "16px 24px 24px" },
    dialogueBox: {
        background: "#151525",
        borderLeft: "4px solid #c9a84c",
        padding: "16px",
        borderRadius: "0 8px 8px 0",
        marginBottom: 14,
        cursor: "pointer",
        minHeight: 90,
    },
    speakerName: {
        color: "#c9a84c", fontWeight: "bold", marginBottom: 8,
        fontSize: "1.05rem", textTransform: "uppercase", letterSpacing: 1,
    },
    narratorText: { color: "#ccc", lineHeight: 1.7, fontSize: "1rem", fontStyle: "italic", margin: 0 },
    dialogueText: { color: "#eee", lineHeight: 1.7, fontSize: "1rem", margin: 0 },
    reaction: {
        display: "flex", alignItems: "center", gap: 10,
        background: "#12122a", borderLeft: "3px solid #5DCAA5",
        padding: "10px 14px", borderRadius: "0 8px 8px 0",
        marginBottom: 10, color: "#ccc", fontSize: "0.9rem", lineHeight: 1.6,
        animation: "fadeIn 0.3s ease",
    },
    reactionName: { color: "#5DCAA5", fontWeight: "bold" },
    options: { display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.25s ease" },
    button: {
        background: "#2a2a4a", color: "#e8e8e8", border: "1px solid #555", borderRadius: 6,
        padding: "10px 16px", cursor: "pointer", textAlign: "left", fontSize: "0.9rem",
    },
    continueButton: {
        background: "#c9a84c", color: "#000", border: "none", borderRadius: 6,
        padding: "12px 16px", cursor: "pointer", textAlign: "center", fontSize: "1rem", fontWeight: "bold",
    },
};