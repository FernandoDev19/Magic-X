import { Inventory } from '../components/Inventory'
import { smallBtn } from '../App'
import type { GameState } from '../types/game-state';

type Props = {
    state: GameState;
    handleBackToHub: () => void;
}

export default function InventoryView({ state, handleBackToHub }: Props) {
    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🎒</span>
                <h2 style={{ color: "#c9a84c", margin: 0, fontSize: 16 }}>Inventario</h2>
            </div>
            <Inventory items={state.player.items} spells={state.player.spells} />
            <button onClick={handleBackToHub} style={{ ...smallBtn, marginTop: 16, marginLeft: 0 }}>← Volver al Hub</button>
        </div>
    )
}