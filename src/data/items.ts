import type { Item } from "../types/item.type";
import type { GameState } from "../types/game-state";
import { ALL_EQUIPMENT } from "./equipment";

export const ALL_ITEMS: Record<string, Item> = {
    gold: {
        id: "gold", name: "Monedas de oro", icon: "💰", usable: false, quantity: 0,
        description: "Monedas de oro.",
    },
    hp_potion: {
        id: "hp_potion", name: "Poción de PV", icon: "🧪", usable: true, quantity: 1,
        onUse: (stats) => ({ hp: Math.min(stats.maxHp, stats.hp + 30) } as any),
        description: "Restaura 30 PV.",
    },
    hp_potion_large: {
        id: "hp_potion_large", name: "Poción de PV Mayor", icon: "🧪", usable: true, quantity: 1,
        onUse: (stats) => ({ hp: Math.min(stats.maxHp, stats.hp + 60) } as any),
        description: "Restaura 60 PV.",
    },
    mana_potion: {
        id: "mana_potion", name: "Poción de Maná", icon: "🫧", usable: true, quantity: 1,
        onUse: (_s, mana) => ({ mana: Math.min(mana.maxMana, mana.mana + 50) } as any),
        description: "Restaura 50 Maná.",
    },
    mana_potion_large: {
        id: "mana_potion_large", name: "Poción de Maná Mayor", icon: "🫧", usable: true, quantity: 1,
        onUse: (_s, mana) => ({ mana: Math.min(mana.maxMana, mana.mana + 100) } as any),
        description: "Restaura 100 Maná.",
    },
    celestial_potion: {
        id: "celestial_potion", name: "Elixir celestial", icon: "✨", usable: true, quantity: 1,
        onUse: (_s, mana) => ({ celestial: Math.min(mana.maxCelestial, mana.celestial + 30) } as any),
        description: "Restaura 30 Maná Celestial. Raro.",
    },
    infernal_potion: {
        id: "infernal_potion", name: "Elixir infernal", icon: "🔥", usable: true, quantity: 1,
        onUse: (_s, mana) => ({ infernal: Math.min(mana.maxInfernal, mana.infernal + 40) } as any),
        description: "Restaura 40 Maná Infernal. Muy raro.",
    },
    soul_fragment: {
        id: "soul_fragment", name: "Fragmento de alma", icon: "💜", usable: true, quantity: 1,
        onUse: (_s, mana) => ({ infernal: Math.min(mana.maxInfernal + 20, mana.infernal + 20) } as any),
        description: "Un fragmento de alma corrompida. Otorga Maná Infernal.",
    },
    elemental_dust: {
        id: "elemental_dust", name: "Polvo elemental", icon: "✨", usable: true, quantity: 1,
        onUse: (_s, mana) => ({ mana: Math.min(mana.maxMana, mana.mana + 25), celestial: Math.min(mana.maxCelestial, mana.celestial + 15) } as any),
        description: "Polvo mágico que restaura maná común y celestial.",
    },
    dark_essence: {
        id: "dark_essence", name: "Esencia oscura", icon: "🌑", usable: true, quantity: 1,
        onUse: (_s, mana) => ({ infernal: Math.min(mana.maxInfernal, mana.infernal + 25) } as any),
        description: "Esencia pura de oscuridad. Otorga Maná Infernal.",
    },
    healing_herbs: {
        id: "healing_herbs", name: "Hierbas curativas", icon: "🌿", usable: true, quantity: 1,
        onUse: (stats) => ({ hp: Math.min(stats.maxHp, stats.hp + 15) } as any),
        description: "Hierbas medicinales. Restauran 15 PV.",
    },
    };

export function getItem(id: string): Item {
    return ALL_ITEMS[id];
}

export function buildInventory(ids: string[]): Item[] {
    const counts: Record<string, number> = {};
    for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
    return Object.entries(counts).map(([id, qty]) => ({
        ...ALL_ITEMS[id],
        quantity: qty,
    }));
}

/** Aplica el efecto de un consumible resolviendo onUse desde la definición base si se perdió al serializar */
export function useConsumableItem(
    player: GameState["player"],
    item: Item
): { newPlayer: GameState["player"]; message: string } | null {
    const baseItem = ALL_ITEMS[item.id];
    const onUse = item.onUse ?? baseItem?.onUse;
    if (!onUse || item.quantity < 1) return null;

    const updates: any = onUse(player.stats, player.mana);

    const newStats = { ...player.stats };
    const newMana = { ...player.mana };

    const msgParts: string[] = [];

    if (updates.hp !== undefined) {
        const hpBefore = newStats.hp;
        newStats.hp = Math.min(newStats.maxHp, Math.max(newStats.hp, updates.hp));
        const diff = newStats.hp - hpBefore;
        if (diff > 0) msgParts.push(`+${diff} PV`);
    }
    if (updates.mana !== undefined) {
        const manaBefore = newMana.mana;
        newMana.mana = Math.min(newMana.maxMana, Math.max(newMana.mana, updates.mana));
        const diff = newMana.mana - manaBefore;
        if (diff > 0) msgParts.push(`+${diff} Maná`);
    }
    if (updates.celestial !== undefined) {
        const celBefore = newMana.celestial;
        if (updates.celestial > newMana.maxCelestial) {
            newMana.maxCelestial = updates.celestial;
        }
        newMana.celestial = Math.min(newMana.maxCelestial, Math.max(newMana.celestial, updates.celestial));
        const diff = newMana.celestial - celBefore;
        if (diff > 0) msgParts.push(`+${diff} Celestial`);
    }
    if (updates.infernal !== undefined) {
        const infBefore = newMana.infernal;
        if (updates.infernal > newMana.maxInfernal) {
            newMana.maxInfernal = updates.infernal;
        }
        newMana.infernal = Math.min(newMana.maxInfernal, Math.max(newMana.infernal, updates.infernal));
        const diff = newMana.infernal - infBefore;
        if (diff > 0) msgParts.push(`+${diff} Infernal`);
    }

    const newItems = player.items
        .map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0 || !i.usable);

    const icon = item.icon ?? baseItem?.icon ?? "🧪";
    const name = item.name ?? baseItem?.name ?? "Objeto";
    const detailText = msgParts.length > 0 ? ` (${msgParts.join(", ")})` : "";
    const message = `Usaste ${icon} ${name}${detailText}.`;

    return {
        newPlayer: {
            ...player,
            stats: newStats,
            mana: newMana,
            items: newItems,
        },
        message,
    };
}

// Convert all equipment into usable items
Object.entries(ALL_EQUIPMENT).forEach(([id, eq]) => {
    if (!ALL_ITEMS[id]) {
        ALL_ITEMS[id] = {
            id: eq.id,
            name: eq.name,
            icon: eq.icon ?? "🛡️",
            usable: false,
            quantity: 1,
            description: eq.description,
        };
    }
});
