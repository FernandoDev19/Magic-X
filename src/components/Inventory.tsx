import type { Item } from "../types/item.type";
import type { Spell } from "../types/spell.type";
import { ALL_ITEMS } from "../data/items";

interface Props {
    items: Item[];
    spells: Spell[];
    onUseItem?: (item: Item) => void;
}

const ELEMENT_ICON: Record<string, string> = {
    fire: "🔥", earth: "🪨", water: "💧", air: "🌪",
    light: "✨", darkness: "🌑", electric: "⚡", vital: "💛",
};

export function Inventory({ items, spells, onUseItem }: Props) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={card}>
                <div style={title}>Inventario ({items.length})</div>
                {items.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#666", fontStyle: "italic", padding: "10px 0" }}>
                        Tu inventario está vacío.
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                        {items.map((item) => {
                            const isConsumable = item.usable || !!ALL_ITEMS[item.id]?.usable;
                            return (
                                <div key={item.id} style={itemCard} title={item.description}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                                        <span style={{ fontSize: 20 }}>{item.icon}</span>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: "bold", color: "#eee" }}>
                                                {item.name}
                                                {item.quantity > 1 && (
                                                    <span style={{ fontSize: 10, color: "#c9a84c", marginLeft: 6 }}>x{item.quantity}</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                                                {item.description}
                                            </div>
                                        </div>
                                    </div>
                                    {isConsumable && onUseItem && (
                                        <button
                                            style={useBtn}
                                            onClick={() => onUseItem(item)}
                                            title="Usar consumible"
                                        >
                                            🧪 Usar
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
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
const itemCard: React.CSSProperties = {
    background: "#12122a",
    border: "1px solid #2a2a4a",
    borderRadius: 6,
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
};
const useBtn: React.CSSProperties = {
    background: "#2a2a5a",
    border: "1px solid #5DCAA544",
    color: "#5DCAA5",
    borderRadius: 4,
    padding: "4px 8px",
    fontSize: 10,
    cursor: "pointer",
    fontWeight: "bold",
    whiteSpace: "nowrap",
};
const spellRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", borderRadius: 5, color: "#ccc" };