import { hubCard, shopItemBtn } from "./HubView";
import { ALL_ITEMS } from "../data/items";
import { smallBtn } from "../App";
import type { GameState } from "../types/game-state";
import type { Item } from "../types/item.type";

const SHOP_ITEMS = [
    { id: "hp_potion", price: 30 },
    { id: "hp_potion_large", price: 50 },
    { id: "mana_potion", price: 40 },
    { id: "mana_potion_large", price: 70 },
    { id: "celestial_potion", price: 60 },
    { id: "infernal_potion", price: 80 },
    { id: "healing_herbs", price: 20 },
    { id: "elemental_dust", price: 45 },
];

type Props = {
    state: GameState;
    shopMessage: string | null;
    handleBackToHub: () => void;
    setShopMessage: (message: string) => void;
    setState: (state: GameState) => void;
};

export default function ShopView({
    state,
    setShopMessage,
    setState,
    shopMessage,
    handleBackToHub,
}: Props) {
    const playerGold =
        state.player.items.find((i) => i.id === "gold")?.quantity || 0;

    function buyItem(itemId: string, price: number) {
        const playerCoins = state.player.items.find(
            (i: Item) => i.id === "gold",
        );

        if (!playerCoins || playerCoins.quantity < price) {
            setShopMessage("No tienes suficiente oro para comprar esto.");
            return;
        }
        const item = ALL_ITEMS[itemId];
        if (!item) return;

        const existing = state.player.items.find((i) => i.id === itemId);
        let newItems: Item[];
        if (existing) {
            newItems = state.player.items.map((i) =>
                i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i,
            );
        } else {
            newItems = [...state.player.items, { ...item, quantity: 1 }];
        }

        newItems = newItems.map((item) =>
            item.id === playerCoins.id
                ? { ...item, quantity: item.quantity - price }
                : item,
        );

        setState({ ...state, player: { ...state.player, items: newItems } });
        setShopMessage(`Â¡Compraste ${item.icon} ${item.name}!`);
    }

    return (
        <div style={hubCard}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                }}
            >
                <span style={{ fontSize: 20 }}>🛒</span>
                <h2 style={{ color: "#c9a84c", margin: 0, fontSize: 16 }}>
                    Tienda de Objetos
                </h2>
            </div>
            <p
                style={{
                    color: "#c9a84c",
                    fontSize: 14,
                    marginBottom: 12,
                    fontWeight: "bold",
                }}
            >
                Tus monedas: {playerGold} 💰
            </p>
            {shopMessage && (
                <div
                    style={{
                        background: "#1e1e0a",
                        border: "1px solid #c9a84c33",
                        borderRadius: 6,
                        padding: "8px 12px",
                        color: "#c9a84c",
                        fontSize: 12,
                        marginBottom: 12,
                    }}
                >
                    {shopMessage}
                </div>
            )}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 8,
                }}
            >
                {SHOP_ITEMS.map((shopItem) => {
                    const item = ALL_ITEMS[shopItem.id];
                    if (!item) return null;
                    return (
                        <button
                            key={shopItem.id}
                            onClick={() => buyItem(shopItem.id, shopItem.price)}
                            style={shopItemBtn}
                        >
                            <div style={{ fontSize: 16 }}>{item.icon}</div>
                            <div style={{ fontSize: 11, color: "#ccc" }}>
                                {item.name}
                            </div>
                            <div
                                style={{
                                    fontSize: 10,
                                    color:
                                        playerGold >= shopItem.price
                                            ? "#c9a84c"
                                            : "#E24B4A",
                                }}
                            >
                                {shopItem.price} 💰
                            </div>
                        </button>
                    );
                })}
            </div>
            <button
                onClick={handleBackToHub}
                style={{ ...smallBtn, marginTop: 16, marginLeft: 0 }}
            >
                ← Volver al Hub
            </button>
        </div>
    );
}
