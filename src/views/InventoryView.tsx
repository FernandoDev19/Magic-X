import { Inventory } from '../components/Inventory'
import { smallBtn } from '../App'
import type { GameState } from '../types/game-state';
import type { Item } from '../types/item.type';
import { useConsumableItem } from '../data/items';
import Swal from 'sweetalert2';

type Props = {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    handleBackToHub: () => void;
}

export default function InventoryView({ state, setState, handleBackToHub }: Props) {
    function handleUseItem(item: Item) {
        const res = useConsumableItem(state.player, item);
        if (!res) return;
        setState((s) => ({ ...s, player: res.newPlayer }));
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: res.message,
            showConfirmButton: false,
            timer: 2500,
            background: "#1a1a2e",
            color: "#eee",
        });
    }

    return (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🎒</span>
                <h2 style={{ color: "#c9a84c", margin: 0, fontSize: 16 }}>Inventario</h2>
            </div>
            <Inventory items={state.player.items} spells={state.player.spells} onUseItem={handleUseItem} />
            <button onClick={handleBackToHub} style={{ ...smallBtn, marginTop: 16, marginLeft: 0 }}>← Volver al Hub</button>
        </div>
    )
}