import type { Companion } from "../types/companion.type";
import type { Condition, GameState, NarrativeEffect, StoryNode, StoryOption } from "../types/game-state";
import { ALL_ITEMS } from "../data/items";
import { getSpellById } from "../data/spells";
import { getCompanionById } from "../data/companions";
import { gainXp, type LevelUpInfo } from "./leveling";
import { completeObjectives } from "./quests";

type Player = GameState["player"];
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function checkCondition(c: Condition | undefined, s: GameState): boolean {
    if (!c) return true;
    const flags = s.flags ?? {};
    const { corruption, sanity } = s.player.stats;
    const has = (id: string) => (s.player.party ?? []).some((p) => p.id === id && p.isRecruited);
    if (c.flag && !flags[c.flag]) return false;
    if (c.notFlag && flags[c.notFlag]) return false;
    if (c.minCorruption !== undefined && corruption < c.minCorruption) return false;
    if (c.maxCorruption !== undefined && corruption > c.maxCorruption) return false;
    if (c.minSanity !== undefined && sanity < c.minSanity) return false;
    if (c.maxSanity !== undefined && sanity > c.maxSanity) return false;
    if (c.companion && !has(c.companion)) return false;
    if (c.notCompanion && has(c.notCompanion)) return false;
    return true;
}

/** Aplica variantes, filtra opciones y reacciones según el estado actual */
export function resolveNode(node: StoryNode, s: GameState): StoryNode {
    const variant = node.variants?.find((v) => checkCondition(v.when, s));
    return {
        ...node,
        speaker: variant?.speaker ?? node.speaker,
        text: variant?.text ?? node.text,
        options: node.options?.filter((o) => checkCondition(o.when, s)),
        reactions: node.reactions?.filter((r) => checkCondition(r.when, s)),
    };
}

function addItem(items: Player["items"], id?: string): Player["items"] {
    if (!id) return items;
    if (items.some((i) => i.id === id)) {
        return items.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
    }
    const def = ALL_ITEMS[id];
    return def ? [...items, { ...def, quantity: 1 }] : items;
}

function recruit(party: Companion[], id: string): Companion[] {
    if (party.some((c) => c.id === id)) {
        return party.map((c) => (c.id === id ? { ...c, isRecruited: true } : c));
    }
    const base = getCompanionById(id);
    return base ? [...party, { ...base, isRecruited: true, isActive: true }] : party;
}

export function applyEffect(
    player: Player,
    e: NarrativeEffect,
): { player: Player; levelUps: LevelUpInfo[] } {
    const st = player.stats;
    const mn = player.mana;
    const addCel = e.celestial ?? 0;
    const addInf = e.infernal ?? 0;

    const newMaxCelestial = addCel > 0 ? Math.max(mn.maxCelestial, mn.maxCelestial + addCel) : mn.maxCelestial;
    const newMaxInfernal = addInf > 0 ? Math.max(mn.maxInfernal, mn.maxInfernal + addInf) : mn.maxInfernal;

    let p: Player = {
        ...player,
        stats: {
            ...st,
            corruption: clamp(st.corruption + (e.corruption ?? 0), 0, st.maxCorruption),
            sanity: clamp(st.sanity + (e.sanity ?? 0), 0, st.maxSanity),
            stability: clamp(st.stability + (e.stability ?? 0), 0, st.maxStability),
            hp: clamp(st.hp + (e.hpChange ?? 0), 1, st.maxHp), // la historia nunca te mata
            physical_strength: st.physical_strength + (e.physical_strength ?? 0),
            magical_strength: st.magical_strength + (e.magical_strength ?? 0),
            speed: st.speed + (e.speed ?? 0),
            resistance: st.resistance + (e.resistance ?? 0),
            magicResistance: st.magicResistance + (e.magicResistance ?? 0),
        },
        mana: {
            ...mn,
            maxCelestial: newMaxCelestial,
            maxInfernal: newMaxInfernal,
            mana: clamp(mn.mana + (e.manaChange ?? 0), 0, mn.maxMana),
            celestial: clamp(mn.celestial + addCel, 0, newMaxCelestial),
            infernal: clamp(mn.infernal + addInf, 0, newMaxInfernal),
        },
        items: addItem(addItem(player.items, e.gainItemId), e.gainItemId2),
    };

    const spell = e.gainSpellId ? getSpellById(e.gainSpellId) : undefined;
    if (spell && !p.spells.some((s) => s.id === spell.id)) {
        p = { ...p, spells: [...p.spells, spell] };
    }

    if (e.xp) {
        const r = gainXp(p, e.xp);
        return { player: r.player, levelUps: r.levelUps };
    }
    return { player: p, levelUps: [] };
}

/** Aplica todo lo que ocurre al salir de un nodo (efectos, flags, misiones, reclutamiento) */
export function applyStep(
    state: GameState,
    node: StoryNode,
    option: StoryOption | undefined,
    logTitle: string,
): { state: GameState; levelUps: LevelUpInfo[] } {
    let player = state.player;
    let levelUps: LevelUpInfo[] = [];

    if (option?.effect) {
        const r = applyEffect(player, option.effect);
        player = r.player;
        levelUps = r.levelUps;
    }

    for (const id of [node.recruitCompanion, option?.recruitCompanion]) {
        if (id) player = { ...player, party: recruit(player.party ?? [], id) };
    }

    const flags = { ...(state.flags ?? {}), ...(node.setFlags ?? {}), ...(option?.setFlags ?? {}) };
    const quests = completeObjectives(state.quests, [
        ...(node.completes ?? []),
        ...(option?.completes ?? []),
    ]);
    const narrative = option
        ? { ...state.narrative, narrativeLog: [...state.narrative.narrativeLog, `[${logTitle}] ${option.text}`] }
        : state.narrative;

    return { state: { ...state, player, flags, quests, narrative }, levelUps };
}