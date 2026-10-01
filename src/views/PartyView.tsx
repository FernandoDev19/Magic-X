import type { GameState } from "../types/game-state";
import { CompanionPanel } from "../components/CompanionPanel";
import { hubCard } from "./HubView";
import { smallBtn } from "../App";

interface Props {
    state: GameState;
    setState: React.Dispatch<React.SetStateAction<GameState>>;
    onBackToHub: () => void;
}

export default function PartyView({ state, setState, onBackToHub }: Props) {
    const party = state.player.party ?? [];

    function handleToggleActive(companionId: string) {
        const updatedParty = party.map((comp) => {
            if (comp.id === companionId) {
                return { ...comp, isActive: !comp.isActive };
            }
            return comp;
        });

        setState({
            ...state,
            player: { ...state.player, party: updatedParty },
        });
    }

    return (
        <div style={hubCard}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                }}
            >
                <div>
                    <h2 style={{ color: "#c9a84c", margin: 0, fontSize: 18 }}>
                        👥 Gestión de Compañeros de Equipo
                    </h2>
                    <span style={{ color: "#aaa", fontSize: 12 }}>
                        Configura qué aliados participan en el combate (Máximo 2 activos)
                    </span>
                </div>
                <button onClick={onBackToHub} style={smallBtn}>
                    ← Volver al Hub
                </button>
            </div>

            <CompanionPanel
                party={party}
                onToggleActive={handleToggleActive}
                isCombat={false}
            />
        </div>
    );
}
