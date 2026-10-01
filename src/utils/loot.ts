import { ALL_ITEMS } from "../data/items";
import type { Enemy } from "../types/enemy.type";
import type { Item } from "../types/item.type";

export interface LootResult {
    items: Item[];
    gold: number;
    xp: number;
}

/**
 * Resolves loot from a list of defeated enemies.
 * Each item in lootTable has a 60% drop chance.
 * Gold is based on enemy level.
 */
export function resolveLoot(enemies: Enemy[]): LootResult {
    const dropped: Item[] = [];
    let totalGold = 0;
    let totalXp = 0;

    for (const enemy of enemies) {
        if (enemy.hp > 0) continue; // only dead enemies drop loot

        totalXp += enemy.xpReward;
        // Gold: level * 5 + random 1-10
        const goldDrop = enemy.level * 5 + Math.floor(Math.random() * 10) + 1;
        totalGold += goldDrop;

        if (!enemy.lootTable || enemy.lootTable.length === 0) continue;

        for (const itemId of enemy.lootTable) {
            // 60% chance per item
            if (Math.random() < 0.6) {
                const itemDef = ALL_ITEMS[itemId];
                if (!itemDef) continue;

                const existing = dropped.find((i) => i.id === itemId);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    dropped.push({ ...itemDef, quantity: 1 });
                }
            }
        }
    }

    return { items: dropped, gold: totalGold, xp: totalXp };
}

/**
 * Merges loot into the player's current item array.
 */
export function mergeLootIntoInventory(
    playerItems: Item[],
    loot: LootResult,
): Item[] {
    let items = [...playerItems];

    // Add gold
    if (loot.gold > 0) {
        const goldIdx = items.findIndex((i) => i.id === "gold");
        if (goldIdx !== -1) {
            items[goldIdx] = {
                ...items[goldIdx],
                quantity: items[goldIdx].quantity + loot.gold,
            };
        } else {
            const goldDef = ALL_ITEMS["gold"];
            items.push({ ...goldDef, quantity: loot.gold });
        }
    }

    // Add dropped items
    for (const drop of loot.items) {
        const idx = items.findIndex((i) => i.id === drop.id);
        if (idx !== -1) {
            items[idx] = { ...items[idx], quantity: items[idx].quantity + drop.quantity };
        } else {
            items.push({ ...drop });
        }
    }

    return items;
}