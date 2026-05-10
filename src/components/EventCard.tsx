import type { StoryNode, StoryOption } from "../types/game-state";

interface Props {
    node: StoryNode;
    onChoice: (option: StoryOption) => void;
    onContinue: () => void;
}

export function EventCard({ node, onChoice, onContinue }: Props) {
    const isNarrator = !node.speaker;

    return (
        <div style={styles.card}>
            <div style={styles.dialogueBox}>
                {!isNarrator && <div style={styles.speaker}>{node.speaker}</div>}
                <p style={isNarrator ? styles.narratorText : styles.dialogueText}>
                    {node.text}
                </p>
            </div>

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
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    card: {
        background: "#1a1a2e",
        border: "1px solid #444",
        borderRadius: 8,
        padding: "24px",
        maxWidth: 640,
        margin: "0 auto",
    },
    dialogueBox: {
        background: "#151525",
        borderLeft: "4px solid #c9a84c",
        padding: "16px",
        borderRadius: "0 8px 8px 0",
        marginBottom: 20,
    },
    speaker: {
        color: "#c9a84c",
        fontWeight: "bold",
        marginBottom: 8,
        fontSize: "1.1rem",
        textTransform: "uppercase",
        letterSpacing: 1
    },
    narratorText: {
        color: "#ccc",
        lineHeight: 1.7,
        fontSize: "1rem",
        fontStyle: "italic"
    },
    dialogueText: {
        color: "#eee",
        lineHeight: 1.7,
        fontSize: "1rem",
    },
    options: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    button: {
        background: "#2a2a4a",
        color: "#e8e8e8",
        border: "1px solid #555",
        borderRadius: 6,
        padding: "10px 16px",
        cursor: "pointer",
        textAlign: "left",
        fontSize: "0.9rem",
        transition: "background 0.2s",
    },
    continueButton: {
        background: "#c9a84c",
        color: "#000",
        border: "none",
        borderRadius: 6,
        padding: "12px 16px",
        cursor: "pointer",
        textAlign: "center",
        fontSize: "1rem",
        fontWeight: "bold",
    }
};
