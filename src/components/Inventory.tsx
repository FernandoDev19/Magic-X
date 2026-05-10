import type { Item } from "../types/item.type";
import type { Spell } from "../types/spell.type";

interface Props {
    items: Item[];
    spells: Spell[];
}

const ELEMENT_ICON: Record<string, string> = {
    fire: "🔥", earth: "🪨", water: "💧", air: "🌪",
    light: "✨", darkness: "🌑", electric: "⚡", vital: "💛",
};

export function Inventory({ items, spells }: Props) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={card}>
                <div style={title}>Inventario</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {items.map((item) => (
                        <div key={item.id} style={itemBox} title={item.description}>
                            <span style={{ fontSize: 14 }}>{item.icon}</span>
                            <span style={{ fontSize: 10 }}>{item.name}</span>
                            {item.quantity > 1 && (
                                <span style={{ fontSize: 10, color: "#c9a84c", marginLeft: 4 }}>x{item.quantity}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div style={card}>
                <div style={title}>Hechizos conocidos ({spells.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {spells.map((spell) => (
                        <div key={spell.id} style={spellRow} title={spell.description}>
                            <span style={{ fontSize: 12 }}>{ELEMENT_ICON[spell.element]}</span>
                            <span style={{ fontSize: 11, flex: 1 }}>{spell.name}</span>
                            <span style={{ fontSize: 10, color: "#888" }}>Nv {spell.requiredLevel}</span>
                            <span style={{ fontSize: 10, color: "#4a9eff" }}>−{spell.manaCost} {spell.manaType}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const card: React.CSSProperties = { background: "#1a1a2e", border: "1px solid #222", borderRadius: 8, padding: 12 };
const title: React.CSSProperties = { fontSize: 10, letterSpacing: 2, color: "#555", marginBottom: 8 };
const itemBox: React.CSSProperties = { background: "#12122a", border: "1px solid #2a2a4a", borderRadius: 6, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5, color: "#ccc", fontSize: 11, cursor: "default" };
const spellRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", borderRadius: 5, color: "#ccc" };