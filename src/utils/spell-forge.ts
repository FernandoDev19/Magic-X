import type {
  MagicElement,
  ElementAffinity,
  ElementLevels,
} from "../types/magic-element.type";
import type { Stats } from "../types/player.type";
import type { ManaType, Spell } from "../types/spell.type";
import type { StatusEffect } from "../types/status-effect.type";
import type {
  CompleteSelection,
  FormId,
  RuneSelection,
  SpellRecipe,
  SubjectId,
  VectorId,
} from "../types/rune.type";
import { ELEMENT_FORGE, getPair } from "../data/forge-tables";
import { areOpposed } from "../data/runes";

/**
 * Motor de síntesis de hechizos.
 *
 *   hechizo = Elementos (1-3)  +  Sujeto  +  Vector  +  Forma
 *
 * Devuelve un `Spell` normal (con `forged: true`) para que castAbilitySingle /
 * castAbilityArea sigan funcionando. Todos los números salen de las tablas de
 * `data/forge-tables.ts` y de los multiplicadores de runas de este archivo:
 * es el sitio donde balancear.
 */

// ─── Ajustes de balance ────────────────────────────────────────────────────
/** Peso del 1.er, 2.º, 3.er... elemento (el primero es el dominante) */
const ELEMENT_WEIGHTS = [1, 0.65, 0.45, 0.3, 0.2];
/** Peso de cada elemento en el coste de maná */
const COST_WEIGHTS = [1, 0.8, 0.8, 0.8, 0.8];
/** Cuánto daño añade la fuerza mágica, y cuánta curación */
const MAGIC_DAMAGE_SCALE = 0.5;
const MAGIC_HEAL_SCALE = 0.3;
/** Inestabilidad: por elemento extra, por choque (opuestos) y descuento por sinergia */
const INSTAB_PER_EXTRA_ELEMENT = 0.04;
const INSTAB_PER_CLASH = 0.12;
const INSTAB_SYNERGY_DISCOUNT = 0.02;
const INSTAB_MAX = 0.75;
/** Sobrecoste de maná por cada choque de opuestos */
const CLASH_COST = 0.15;

const SUBJECT: Record<
  SubjectId,
  { target: Spell["targetType"]; dmg: number; cost: number }
> = {
  ego: { target: "self", dmg: 0, cost: 1 },
  ille: { target: "enemy", dmg: 1, cost: 1 },
  illi: { target: "area", dmg: 0.75, cost: 1.6 },
};

const VECTOR: Record<
  VectorId,
  {
    dmgSingle: number;
    dmgArea: number;
    cost: number;
    potency: number;
    duration: number;
    stab: number;
    healMult: number;
  }
> = {
  pro: {
    dmgSingle: 1.1,
    dmgArea: 1.1,
    cost: 1,
    potency: 1,
    duration: 0,
    stab: 1,
    healMult: 1,
  },
  retro: {
    dmgSingle: 0.85,
    dmgArea: 0.85,
    cost: 0.9,
    potency: 1,
    duration: 0,
    stab: 1,
    healMult: 1.1,
  },
  surfum: {
    dmgSingle: 1.1,
    dmgArea: 1.25,
    cost: 1.3,
    potency: 1,
    duration: 0,
    stab: 1,
    healMult: 1,
  },
  terra: {
    dmgSingle: 0.7,
    dmgArea: 0.7,
    cost: 1.1,
    potency: 1.25,
    duration: 1,
    stab: 0.7,
    healMult: 0.9,
  },
};

const FORM: Record<
  FormId,
  {
    dmg: number;
    cost: number;
    potency: number;
    duration: number;
    crit: number;
    critMult: number;
    pierce: number;
    stab: number;
    healMult: number;
  }
> = {
  acies: {
    dmg: 1.15,
    cost: 1.1,
    potency: 0.7,
    duration: 0,
    crit: 0.25,
    critMult: 1.75,
    pierce: 0.35,
    stab: 1,
    healMult: 0.9,
  },
  lene: {
    dmg: 0.8,
    cost: 0.9,
    potency: 1.3,
    duration: 1,
    crit: 0,
    critMult: 1.5,
    pierce: 0,
    stab: 0.8,
    healMult: 1.2,
  },
};

const SELF_BUFFS = new Set([
  "strengthened",
  "velocitized",
  "guarding",
  "invisible",
]);

const ELEMENT_TITLES: Record<string, { prefix: string; noun: string }> = {
  darkness: { prefix: "Umbrío", noun: "de la Penumbra" },
  light: { prefix: "Radiante", noun: "del Alba Solitaria" },
  wind: { prefix: "Aéreo", noun: "del Susurro Ventoso" },
  earth: { prefix: "Telúrico", noun: "de la Grieta Ancestral" },
  vital: { prefix: "Vigoroso", noun: "de la Carne Pulsante" },
  fire: { prefix: "Ígneo", noun: "de la Llama Eterna" },
};

const ACTION_MATRIX: Record<SubjectId, Record<FormId, string>> = {
  ego: { acies: "Baluarte", lene: "Manto" },
  ille: { acies: "Estocada", lene: "Suspiro" },
  illi: { acies: "Cataclismo", lene: "Sinfonía" },
};

// ─── Tipos ─────────────────────────────────────────────────────────────────
export interface ForgeContext {
  /** Stats efectivos del jugador (con equipo y estados) */
  stats: Stats;
  elementLevels: ElementLevels;
  elementAffinity: ElementAffinity;
}

export interface ForgedSpell {
  spell: Spell;
  /** Probabilidad (0-1) de que el hechizo se desestabilice al lanzarlo */
  instability: number;
  clashes: number;
  /** Líneas de explicación para la vista previa */
  notes: string[];
}

// ─── Nombre ────────────────────────────────────────────────────────────────
const NAME_BY_SUBJECT: Record<SubjectId, Record<FormId, string>> = {
  ego: { acies: "Cuchillas defensivas de", lene: "Velo de" },
  ille: { acies: "Lanza de", lene: "Aliento de" },
  illi: { acies: "Tormenta cortante de", lene: "Nube de" },
};
const VECTOR_SUFFIX: Record<VectorId, string> = {
  pro: "",
  retro: " del retorno",
  surfum: " desde el cielo",
  terra: " ancestral",
};

function elementsNoun(els: MagicElement[]): string {
  const noun = (e: MagicElement) => ELEMENT_FORGE[e].noun;
  if (els.length === 0) return "…";
  if (els.length === 1) return noun(els[0]);
  const first =
    getPair(els[0], els[1])?.name ?? `${noun(els[0])} y ${noun(els[1])}`;
  if (els.length === 2) return first;
  return `${first} y ${noun(els[2])}`;
}

/** Nombre del hechizo para una selección (puede estar incompleta) */
export function forgeName(
  sel: Pick<RuneSelection, "elements" | "subject" | "vector" | "form">,
  stats?: { sanity: number; corruption: number },
): string {
  const subject = sel.subject ?? "ille";
  const form = sel.form ?? "acies";
  const vector = sel.vector ?? "pro";
  const mainEl = sel.elements[0] ?? "darkness";

  const baseAction = ACTION_MATRIX[subject][form];
  const elInfo = ELEMENT_TITLES[mainEl] ?? {
    prefix: "Místico",
    noun: "Arcano",
  };

  // Modificadores por estado de cordura/corrupción (LOTM style)
  let modifier = elInfo.prefix;
  if (stats) {
    if (stats.sanity < 30) modifier = `Demente ${modifier}`;
    else if (stats.corruption > 70) modifier = `Blasfemo ${modifier}`;
  }

  // Sufijo rúnico por Vector (Witch Hat style)
  const vectorSuffix: Record<VectorId, string> = {
    pro: "",
    retro: " del Retorno Inverso",
    surfum: " Caído del Firmamento",
    terra: " Anclado en el Enjambre",
  };

  return `${baseAction} ${modifier} ${elInfo.noun}${vectorSuffix[vector]}`;
}

// ─── Forja ─────────────────────────────────────────────────────────────────
function mentalMult(el: MagicElement, corruption: number): number {
  // Corrupción 50 = neutro. Alta potencia la Sombra y debilita la Luz; baja hace lo contrario.
  const c = (corruption - 50) / 100;
  if (el === "darkness") return 1 + c * 0.6;
  if (el === "light") return 1 - c * 0.6;
  return 1;
}

function mergeEffect(list: StatusEffect[], e: StatusEffect) {
  const i = list.findIndex((x) => x.type === e.type);
  if (i === -1) return list.push(e);
  const cur = list[i];
  list[i] = {
    ...cur,
    duration: Math.max(cur.duration, e.duration),
    value: Math.max(cur.value ?? 0, e.value ?? 0) || undefined,
  };
}

export function forgeSpell(
  sel: CompleteSelection,
  ctx: ForgeContext,
): ForgedSpell {
  const els = [...new Set(sel.elements)];
  const n = els.length;
  const subj = SUBJECT[sel.subject];
  const vec = VECTOR[sel.vector];
  const form = FORM[sel.form];
  const isArea = sel.subject === "illi";
  const isSelf = sel.subject === "ego";
  const { corruption, sanity, stability, magical_strength } = ctx.stats;
  const notes: string[] = [];

  const w = (i: number) => ELEMENT_WEIGHTS[i] ?? 0.2;
  const weights: Partial<Record<MagicElement, number>> = {};
  els.forEach((e, i) => (weights[e] = w(i)));
  const scale = (e: MagicElement) => 1 + (ctx.elementLevels[e] ?? 0) * 0.15;

  // Pares: sinergias y choques
  const pairs: { a: MagicElement; b: MagicElement }[] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) pairs.push({ a: els[i], b: els[j] });
  const pairData = pairs.map((p) => ({
    ...p,
    data: getPair(p.a, p.b),
    clash: areOpposed(p.a, p.b),
  }));
  const clashes = pairData.filter((p) => p.clash).length;

  for (const p of pairData) {
    if (p.data)
      notes.push(`${p.clash ? "⚡ Choque" : "✦ Sinergia"}: ${p.data.name}`);
    else if (p.clash) notes.push("⚡ Choque de opuestos (Aniquilación)");
  }

  // ─── Modificadores Dinámicos de Estado Mental (LOTM) ──────────────────────
  const isMadness = sanity < 30; // Al borde de perder el control
  const isHighCorrupt = corruption >= 80;
  const madnessDmgMult = isMadness ? 1.25 : 1.0; // +25% daño por locura

  if (isMadness)
    notes.push("🧠 Locura Imminente: +25% Daño, pero mayor inestabilidad");
  if (isHighCorrupt && els.includes("light"))
    notes.push("🜏 Luz Distorsionada por la Corrupción");

  // Daño
  const pairDmg =
    1 + pairData.reduce((s, p) => s + ((p.data?.dmg ?? 1) - 1), 0);
  let rawDamage = els.reduce(
    (s, e, i) =>
      s + w(i) * ELEMENT_FORGE[e].damage * scale(e) * mentalMult(e, corruption),
    0,
  );
  rawDamage = rawDamage * pairDmg + magical_strength * MAGIC_DAMAGE_SCALE;

  // Daño final con bono de locura
  const damage = Math.round(
    rawDamage *
      subj.dmg *
      (isArea ? vec.dmgArea : vec.dmgSingle) *
      form.dmg *
      madnessDmgMult,
  );

  // Bono por Tríada Armónica (3 elementos sin opuestos)
  const isHarmonicTriad = n === 3 && clashes === 0;
  if (isHarmonicTriad) {
    rawDamage *= 1.3; // +30% daño base
    notes.push(
      "✦ Tríada Armónica: Resonancia elemental perfecta (+30% Potencia)",
    );
  }

  // Curación (solo Ego)
  const pairHeal =
    1 + pairData.reduce((s, p) => s + ((p.data?.heal ?? 1) - 1), 0);
  const baseHeal = els.reduce(
    (s, e, i) =>
      s + w(i) * ELEMENT_FORGE[e].heal * scale(e) * mentalMult(e, corruption),
    0,
  );
  const heal =
    isSelf && baseHeal > 0
      ? Math.round(
          (baseHeal * pairHeal + magical_strength * MAGIC_HEAL_SCALE) *
            form.healMult *
            vec.healMult,
        )
      : 0;

  // Estados
  const potency = form.potency * vec.potency;
  const extraDuration = form.duration + vec.duration;
  const effects: StatusEffect[] = [];
  const addEffect = (base: StatusEffect | undefined, weight: number) => {
    if (!base) return;
    const e: StatusEffect = {
      ...base,
      duration: Math.max(1, base.duration + extraDuration),
    };
    if (base.value !== undefined)
      e.value = Math.max(
        1,
        Math.round(base.value * potency * (0.6 + 0.4 * weight)),
      );
    mergeEffect(effects, e);
  };
  els.forEach((e, i) =>
    addEffect(isSelf ? ELEMENT_FORGE[e].self : ELEMENT_FORGE[e].offense, w(i)),
  );
  for (const p of pairData) {
    const eff = p.data?.effect;
    if (!eff) continue;
    if (isSelf && !SELF_BUFFS.has(eff.type)) continue;
    addEffect(eff, 1);
  }
  if (isSelf && sel.vector === "terra")
    addEffect({ type: "guarding", duration: 1 }, 1);
  effects.splice(3);

  // Perforación y críticos (El choque de elementos aporta perforación masiva / daño verdadero)
  const clashPierceBonus = clashes * 0.25;
  const pierce = Math.min(
    0.95,
    form.pierce +
      clashPierceBonus +
      els.reduce((s, e, i) => s + w(i) * ELEMENT_FORGE[e].pierce, 0) +
      pairData.reduce((s, p) => s + (p.data?.pierce ?? 0), 0),
  );
  const critChance = Math.min(
    0.75,
    form.crit + pairData.reduce((s, p) => s + (p.data?.crit ?? 0), 0),
  );

  // Coste
  const manaType: ManaType = els.includes("darkness")
    ? "infernal"
    : els.includes("light")
      ? "celestial"
      : "mana";
  const baseCost = els.reduce(
    (s, e, i) =>
      s +
      (COST_WEIGHTS[i] ?? 0.8) *
        ELEMENT_FORGE[e].cost *
        (ctx.elementAffinity[e] ?? 1),
    0,
  );
  const manaCost = Math.max(
    1,
    Math.round(
      baseCost * subj.cost * vec.cost * form.cost * (1 + CLASH_COST * clashes),
    ),
  );

  // Inestabilidad Dinámica
  let instability = 0;
  if (n > 1 || isMadness) {
    instability =
      INSTAB_PER_EXTRA_ELEMENT * (n - 1) +
      INSTAB_PER_CLASH * clashes -
      INSTAB_SYNERGY_DISCOUNT *
        pairData.filter((p) => p.data && !p.clash).length;
    instability = Math.max(0, instability);

    // Penalización extra por locura o cordura baja
    if (isMadness) instability += 0.2;
    else instability += Math.max(0, (60 - sanity) / 200);

    instability *= 1 - Math.min(0.9, stability / 200);
    instability *= form.stab * vec.stab;
    instability = Math.min(INSTAB_MAX, Math.max(0, instability));
  }

  // Corrupción
  const corruptionShift =
    (manaType === "infernal" ? 1 : manaType === "celestial" ? -1 : 0) +
    pairData.reduce((s, p) => s + (p.data?.corruption ?? 0), 0);

  // Siphon (Retro)
  const siphon: Spell["siphon"] = {};
  if (!isSelf) {
    if (sel.vector === "retro") siphon.mana = 0.25;
    const vitalW = Math.max(weights.light ?? 0, weights.vital ?? 0);
    if (vitalW > 0)
      siphon.hp =
        Math.round(vitalW * (sel.vector === "retro" ? 0.3 : 0.15) * 100) / 100;
  }

  if (sel.vector === "retro" && !isSelf)
    notes.push("↩ Recuperas maná del daño causado");
  if (sel.vector === "terra")
    notes.push("⚓ Anclado: más estable, estados potentes");
  if (corruptionShift > 0)
    notes.push(`☠ +${corruptionShift} Corrupción al lanzar`);
  if (corruptionShift < 0)
    notes.push(`✧ ${corruptionShift} Corrupción al lanzar`);

  // Generar nombre dinámico (Luz Aberrante si corrupción > 80)
  let spellName = forgeName({
    elements: els,
    subject: sel.subject,
    vector: sel.vector,
    form: sel.form,
  });
  if (isHighCorrupt && els.includes("light")) {
    spellName = spellName.replace("Luz", "Luz Aberrante");
  }

  const spell: Spell = {
    id: `forged:${recipeId({ elements: els, subject: sel.subject, vector: sel.vector, form: sel.form })}`,
    name: spellName,
    element: els[0],
    requiredLevel: 0,
    manaCost,
    manaType,
    damage: damage > 0 ? damage : undefined,
    heal: heal > 0 ? heal : undefined,
    effects: effects.length ? effects : undefined,
    targetType: subj.target,
    areaEffect: isArea || undefined,
    description: generateDynamicDescription(
      sel,
      damage,
      heal,
      instability,
      isMadness,
    ),
    forged: true,
    elements: els,
    elementWeights: weights,
    pierce: pierce > 0 ? Math.round(pierce * 100) / 100 : undefined,
    critChance: critChance > 0 ? Math.round(critChance * 100) / 100 : undefined,
    critMult: form.critMult,
    siphon: siphon.mana || siphon.hp ? siphon : undefined,
    corruptionShift: corruptionShift || undefined,
    runes: {
      elements: els,
      subject: sel.subject,
      vector: sel.vector,
      form: sel.form,
    },
  };

  return { spell, instability, clashes, notes };
}

// Generador dinámico de descripciones con tono místico
function generateDynamicDescription(
  sel: CompleteSelection,
  damage: number,
  heal: number,
  instability: number,
  isMadness: boolean,
): string {
  const targetText =
    sel.subject === "ego"
      ? "sobre el propio cuerpo"
      : sel.subject === "ille"
        ? "hacia un objetivo"
        : "en área sobre el campo";
  let desc = `Encantamiento enfocado ${targetText}.`;

  if (damage > 0) desc += ` Inflige ${damage} de daño.`;
  if (heal > 0) desc += ` Restaura ${heal} PV.`;

  if (instability > 0.4) {
    desc += " El trazo rúnico vibra con inestabilidad peligrosa.";
  }
  if (isMadness) {
    desc += " Sintonizado con el susurro de la locura.";
  }

  return desc;
}

function describe(
  sel: CompleteSelection,
  damage: number,
  heal: number,
  effects: StatusEffect[],
): string {
  const who =
    sel.subject === "ego"
      ? "sobre ti"
      : sel.subject === "ille"
        ? "contra un objetivo"
        : "contra todos los enemigos";
  const parts = [`Hechizo ${who}.`];
  if (damage > 0) parts.push(`Daño base ${damage}.`);
  if (heal > 0) parts.push(`Cura ${heal} PV.`);
  if (effects.length)
    parts.push(`Estados: ${effects.map((e) => e.type).join(", ")}.`);
  return parts.join(" ");
}

// ─── Recetas (atajos guardados en el grimorio) ─────────────────────────────
/** Identificador estable: el elemento dominante cuenta aparte; el resto, sin orden */
export function recipeId(
  r: Pick<SpellRecipe, "elements" | "subject" | "vector" | "form">,
): string {
  const [first, ...rest] = r.elements;
  return `${first}>${[...rest].sort().join("+")}|${r.subject}|${r.vector}|${r.form}`;
}

export function makeRecipe(
  sel: CompleteSelection,
  source: SpellRecipe["source"] = "crafted",
): SpellRecipe {
  return {
    id: recipeId(sel),
    elements: sel.elements,
    subject: sel.subject,
    vector: sel.vector,
    form: sel.form,
    source,
  };
}

/** Convierte un hechizo clásico (spells.ts) en su receta aproximada */
export function spellToRecipe(s: Spell): SpellRecipe {
  const elements = [
    s.element,
    ...(s.comboElements ?? []).filter((e) => e !== s.element),
  ].slice(0, 3);
  const subject: SubjectId =
    s.areaEffect || s.targetType === "area"
      ? "illi"
      : s.targetType === "self"
        ? "ego"
        : "ille";
  const form: FormId = s.damage ? "acies" : "lene";
  const base = { elements, subject, vector: "pro" as VectorId, form };
  return { id: recipeId(base), ...base, source: "story" };
}

/** Recetas guardadas + las derivadas de los hechizos clásicos que el jugador conoce */
export function getKnownRecipes(player: {
  recipes?: SpellRecipe[];
  spells: Spell[];
}): SpellRecipe[] {
  const out = new Map<string, SpellRecipe>();
  for (const r of player.recipes ?? []) out.set(r.id, r);
  for (const s of player.spells) {
    const r = spellToRecipe(s);
    if (!out.has(r.id)) out.set(r.id, r);
  }
  return [...out.values()];
}
