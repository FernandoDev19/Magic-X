import { useState } from "react";
import type { EquipmentItem, EquipmentSlot } from "../types/equipment.type";
import type { GameState } from "../types/game-state";
import { ALL_EQUIPMENT } from "../data/equipment";
import { equipItem, unequipSlot, getSlotLabel, getSlotIcon, getTotalBonuses, hasTwoHandedWeapon } from "../utils/equipment";

interface Props {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    handleBackToHub: () => void;
}

const SLOTS: EquipmentSlot[] = ["mainHand", "offHand", "armor", "accessory1", "accessory2"];

export default function EquipmentView({ state, setState, handleBackToHub }: Props) {
    const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const gear = state.player.equipment;
    const bonuses = getTotalBonuses(gear);

    /** Items del inventario que pueden equiparse en el slot seleccionado */
    function getEquippableItems(slot: EquipmentSlot): EquipmentItem[] {
        const results: EquipmentItem[] = [];
        for (const item of state.player.items) {
            const eq = ALL_EQUIPMENT[item.id];
            if (eq && eq.validSlots.includes(slot)) {
                // No mostrar si ya está equipado en ese slot
                if (gear[slot]?.id !== eq.id) {
                    results.push(eq);
                }
            }
        }
        return results;
    }

    function handleEquip(eqItem: EquipmentItem, slot: EquipmentSlot) {
        const { newGear, unequipped, error } = equipItem(gear, eqItem, slot);
        if (error) {
            setMessage(error);
            return;
        }

        // Quitar el item del inventario
        let newItems = [...state.player.items];
        const idx = newItems.findIndex(i => i.id === eqItem.id);
        if (idx !== -1) {
            if (newItems[idx].quantity > 1) {
                newItems[idx] = { ...newItems[idx], quantity: newItems[idx].quantity - 1 };
            } else {
                newItems.splice(idx, 1);
            }
        }

        // Devolver items desequipados al inventario
        for (const unEq of unequipped) {
            const existing = newItems.findIndex(i => i.id === unEq.id);
            if (existing !== -1) {
                newItems[existing] = { ...newItems[existing], quantity: newItems[existing].quantity + 1 };
            } else {
                // Crear como Item normal
                const itemDef = ALL_EQUIPMENT[unEq.id];
                if (itemDef) {
                    newItems.push({
                        id: itemDef.id,
                        name: itemDef.name,
                        icon: itemDef.icon,
                        description: itemDef.description,
                        usable: false,
                        quantity: 1,
                    });
                }
            }
        }

        setState({
            ...state,
            player: { ...state.player, equipment: newGear, items: newItems },
        });
        setMessage(`Equipaste ${eqItem.icon} ${eqItem.name}.`);
        setSelectedSlot(null);
    }

    function handleUnequip(slot: EquipmentSlot) {
        const { newGear, unequipped } = unequipSlot(gear, slot);
        if (!unequipped) return;

        let newItems = [...state.player.items];
        const existing = newItems.findIndex(i => i.id === unequipped.id);
        if (existing !== -1) {
            newItems[existing] = { ...newItems[existing], quantity: newItems[existing].quantity + 1 };
        } else {
            newItems.push({
                id: unequipped.id,
                name: unequipped.name,
                icon: unequipped.icon,
                description: unequipped.description,
                usable: false,
                quantity: 1,
            });
        }

        setState({
            ...state,
            player: { ...state.player, equipment: newGear, items: newItems },
        });
        setMessage(`Desequipaste ${unequipped.icon} ${unequipped.name}.`);
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>⚔️</span>
                <h2 style={{ color: "#c9a84c", margin: 0, fontSize: 16 }}>Equipamiento</h2>
            </div>

            {message && (
                <div style={messageBox}>{message}</div>
            )}

            {/* Bonus summary */}
            <div style={bonusBar}>
                <span style={{ fontSize: 10, color: "#888", letterSpacing: 1.5 }}>BONIFICACIONES TOTALES</span>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                    {bonuses.physical_strength ? <BonusBadge label="F. Física" value={bonuses.physical_strength} /> : null}
                    {bonuses.magical_strength ? <BonusBadge label="F. Mágica" value={bonuses.magical_strength} /> : null}
                    {bonuses.resistance ? <BonusBadge label="Resistencia" value={bonuses.resistance} /> : null}
                    {bonuses.magicResistance ? <BonusBadge label="Res. Mágica" value={bonuses.magicResistance} /> : null}
                    {bonuses.speed ? <BonusBadge label="Velocidad" value={bonuses.speed} /> : null}
                    {bonuses.maxHp ? <BonusBadge label="PV Máx" value={bonuses.maxHp} /> : null}
                    {bonuses.maxMana ? <BonusBadge label="Maná Máx" value={bonuses.maxMana} /> : null}
                    {bonuses.maxCelestial ? <BonusBadge label="Celestial" value={bonuses.maxCelestial} /> : null}
                    {bonuses.maxInfernal ? <BonusBadge label="Infernal" value={bonuses.maxInfernal} /> : null}
                </div>
            </div>

            {/* Slots */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {SLOTS.map(slot => {
                    const item = gear[slot];
                    const isBlocked = slot === "offHand" && hasTwoHandedWeapon(gear);

                    return (
                        <div key={slot} style={slotCard}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontSize: 10, color: "#666", letterSpacing: 1 }}>
                                        {getSlotIcon(slot)} {getSlotLabel(slot).toUpperCase()}
                                        {isBlocked && <span style={{ color: "#E24B4A", marginLeft: 6 }}>(Bloqueado — arma 2 manos)</span>}
                                    </div>
                                    {item ? (
                                        <div style={{ marginTop: 4 }}>
                                            <span style={{ fontSize: 14 }}>{item.icon}</span>
                                            <span style={{ fontSize: 12, color: "#eee", marginLeft: 6, fontWeight: 600 }}>{item.name}</span>
                                            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{item.description}</div>
                                            <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                                                {Object.entries(item.bonuses).map(([k, v]) => (
                                                    <span key={k} style={{ fontSize: 9, color: (v as number) > 0 ? "#4CAF50" : "#E24B4A", background: "#0d0d1a", padding: "1px 5px", borderRadius: 3 }}>
                                                        {(v as number) > 0 ? "+" : ""}{v as number} {statLabel(k)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 11, color: "#444", marginTop: 4, fontStyle: "italic" }}>Vacío</div>
                                    )}
                                </div>
                                <div style={{ display: "flex", gap: 4 }}>
                                    {item && (
                                        <button style={unequipBtn} onClick={() => handleUnequip(slot)}>✕</button>
                                    )}
                                    {!isBlocked && (
                                        <button
                                            style={equipBtn}
                                            onClick={() => setSelectedSlot(selectedSlot === slot ? null : slot)}
                                        >
                                            {selectedSlot === slot ? "▲" : "▼"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Dropdown de items disponibles */}
                            {selectedSlot === slot && !isBlocked && (
                                <div style={dropdownBox}>
                                    {getEquippableItems(slot).length === 0 ? (
                                        <div style={{ fontSize: 10, color: "#555", fontStyle: "italic" }}>No tienes items para este slot.</div>
                                    ) : (
                                        getEquippableItems(slot).map(eq => (
                                            <button
                                                key={eq.id}
                                                style={itemOption}
                                                onClick={() => handleEquip(eq, slot)}
                                            >
                                                <span>{eq.icon}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: 11, color: "#eee" }}>{eq.name}</div>
                                                    <div style={{ fontSize: 9, color: "#888" }}>{eq.description}</div>
                                                    <div style={{ display: "flex", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                                                        {Object.entries(eq.bonuses).map(([k, v]) => (
                                                            <span key={k} style={{ fontSize: 9, color: (v as number) > 0 ? "#4CAF50" : "#E24B4A" }}>
                                                                {(v as number) > 0 ? "+" : ""}{v as number} {statLabel(k)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <button onClick={handleBackToHub} style={{ ...backBtn, marginTop: 16 }}>← Volver al Hub</button>
        </div>
    );
}

function BonusBadge({ label, value }: { label: string; value: number }) {
    const color = value > 0 ? "#4CAF50" : "#E24B4A";
    return (
        <span style={{ fontSize: 10, color, background: "#12122a", padding: "2px 6px", borderRadius: 4, border: `1px solid ${color}33` }}>
            {value > 0 ? "+" : ""}{value} {label}
        </span>
    );
}

function statLabel(key: string): string {
    const map: Record<string, string> = {
        physical_strength: "F.Fís",
        magical_strength: "F.Mág",
        resistance: "Res",
        magicResistance: "Res.Mág",
        speed: "Vel",
        maxHp: "PV",
        maxMana: "Maná",
        maxCelestial: "Celestial",
        maxInfernal: "Infernal",
    };
    return map[key] ?? key;
}

// Styles
const slotCard: React.CSSProperties = { background: "#1a1a2e", border: "1px solid #222", borderRadius: 8, padding: 12 };
const bonusBar: React.CSSProperties = { background: "#12122a", border: "1px solid #2a2a4a", borderRadius: 8, padding: "8px 12px" };
const messageBox: React.CSSProperties = { background: "#1D9E7522", border: "1px solid #1D9E75", borderRadius: 6, padding: "6px 12px", fontSize: 11, color: "#1D9E75", marginBottom: 10 };
const equipBtn: React.CSSProperties = { background: "#12122a", border: "1px solid #2a2a4a", borderRadius: 5, padding: "4px 8px", color: "#c9a84c", cursor: "pointer", fontSize: 10, fontFamily: "Georgia, serif" };
const unequipBtn: React.CSSProperties = { background: "#12122a", border: "1px solid #E24B4A33", borderRadius: 5, padding: "4px 8px", color: "#E24B4A", cursor: "pointer", fontSize: 10, fontFamily: "Georgia, serif" };
const dropdownBox: React.CSSProperties = { marginTop: 8, background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 6, padding: 8, display: "flex", flexDirection: "column", gap: 4 };
const itemOption: React.CSSProperties = { background: "#12122a", border: "1px solid #2a2a4a", borderRadius: 6, padding: "6px 10px", display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", textAlign: "left", fontFamily: "Georgia, serif", color: "#ccc" };
const backBtn: React.CSSProperties = { background: "transparent", color: "#ccc", border: "1px solid currentColor", borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 11, fontFamily: "Georgia, serif" };
