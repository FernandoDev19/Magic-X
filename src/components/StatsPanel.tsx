import { MAGIC_SCHOOLS } from "../data/magic";
import type {
  ElementAffinity,
  ElementLevels,
} from "../types/magic-element.type";
import type { Mana, Role, Stats } from "../types/player.type";
import type { StatusEffect } from "../types/status-effect.type";
import { levelProgress } from "../utils/leveling";
import { Portrait } from "./Portrait";

interface Props {
  stats: Stats;
  mana: Mana;
  role: Role;
  statusEffects: StatusEffect[];
  elementLevels: ElementLevels;
  elementAffinity: ElementAffinity;
  characterName: string;
  xp: number;
  level: number;
  gold: number;
}

function Bar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div
      style={{
        flex: 1,
        height: 5,
        background: "#1e1e3a",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 3,
          transition: "width 0.4s",
        }}
      />
    </div>
  );
}

export function StatsPanel({
  stats,
  mana,
  role,
  statusEffects,
  elementLevels,
  elementAffinity,
  characterName,
  xp,
  level,
  gold,
}: Props) {
  return (
    <div style={panel}>
      {/* Avatar */}
      <div style={header}>
        <Portrait name={characterName} size={36} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#eee" }}>
            {characterName}
          </div>
          <div style={{ fontSize: 10, color: "#666" }}>{role}</div>
          <div style={{ fontSize: 10, color: "#c9a84c" }}>
            Nv {level} · 💰 {gold}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginTop: 3,
            }}
          >
            <Bar
              value={levelProgress(level, xp).pct}
              max={100}
              color="#c9a84c"
            />
            <span style={{ fontSize: 8, color: "#888" }}>
              {levelProgress(level, xp).into}/{levelProgress(level, xp).needed}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {[
        {
          label: "PV",
          value: stats.hp,
          max: stats.maxHp,
          color: "#1D9E75",
        },
        {
          label: "Fuerza física",
          value: stats.physical_strength,
          max: 100,
          color: "#378ADD",
        },
        {
          label: "Fuerza mágica",
          value: stats.magical_strength,
          max: 100,
          color: "#378ADD",
        },
        {
          label: "Velocidad",
          value: stats.speed,
          max: 100,
          color: "#378ADD",
        },
        {
          label: "Resistencia física",
          value: stats.resistance,
          max: 100,
          color: "#5DCAA5",
        },
        {
          label: "Resistencia mágica",
          value: stats.magicResistance,
          max: 100,
          color: "#7F77DD",
        },
        {
          label: "Corrupción",
          value: stats.corruption,
          max: stats.maxCorruption,
          color: "#E24B4A",
        },
        {
          label: "Cordura",
          value: stats.sanity,
          max: stats.maxSanity,
          color: "#1D9E75",
        },
        {
          label: "Estabilidad",
          value: stats.stability,
          max: stats.maxStability,
          color: "#1D9E75",
        },
      ].map(({ label, value, max, color }) => (
        <div
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginBottom: 5,
          }}
        >
          <span style={{ fontSize: 10, color: "#666", width: 68 }}>
            {label}
          </span>
          <Bar value={value} max={max} color={color} />
          <span
            style={{
              fontSize: 10,
              color: "#ccc",
              width: 28,
              textAlign: "right",
            }}
          >
            {value}
          </span>
        </div>
      ))}

      {/* Maná */}
      <div style={sep}>MANÁ</div>
      {[
        {
          label: "Maná",
          value: mana.mana,
          max: mana.maxMana,
          color: "#378ADD",
        },
        {
          label: "Celestial",
          value: mana.celestial,
          max: Math.max(1, mana.maxCelestial),
          color: "#FAC775",
        },
        {
          label: "Infernal",
          value: mana.infernal,
          max: Math.max(1, mana.maxInfernal),
          color: "#7F77DD",
        },
      ].map(({ label, value, max, color }) => (
        <div key={label} style={{ marginBottom: 6 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 9,
              color: "#555",
              marginBottom: 2,
            }}
          >
            <span style={{ color: "#888" }}>{label}</span>
            <span style={{ color: "#ccc" }}>
              {value}/{max}
            </span>
          </div>
          <Bar value={value} max={max} color={color} />
        </div>
      ))}

      {/* Elementos */}
      <div style={sep}>NIVELES DE MAGIA</div>
      {MAGIC_SCHOOLS.map((school) => {
        const level = elementLevels[school.element];
        const aff = elementAffinity[school.element];
        const affLabel = aff < 1 ? "↓coste" : aff > 1.2 ? "↑coste" : "";
        return (
          <div
            key={school.element}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginBottom: 5,
            }}
          >
            <span style={{ fontSize: 11, width: 16 }}>{school.icon}</span>
            <span style={{ fontSize: 9, color: "#666", width: 54 }}>
              {school.name}
            </span>
            <Bar value={level} max={school.maxLevel} color={school.color} />
            <span
              style={{
                fontSize: 9,
                color: school.color,
                width: 22,
                textAlign: "right",
              }}
            >
              {level}
            </span>
            {affLabel && (
              <span
                style={{
                  fontSize: 8,
                  color: aff < 1 ? "#1D9E75" : "#E24B4A",
                }}
              >
                {affLabel}
              </span>
            )}
          </div>
        );
      })}

      {/* Status effects */}
      {statusEffects.length > 0 && (
        <>
          <div style={sep}>ESTADOS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {statusEffects.map((e, i) => (
              <span key={i} style={chip}>
                {e.type} {e.permanent ? "∞" : `(${e.duration}t)`}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const panel: React.CSSProperties = {
  background: "#12122a",
  border: "1px solid #222",
  borderRadius: 8,
  padding: 14,
};
const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 12,
  paddingBottom: 10,
  borderBottom: "1px solid #1e1e3a",
};
const sep: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: 2,
  color: "#444",
  margin: "10px 0 6px",
  borderTop: "1px solid #1e1e3a",
  paddingTop: 8,
};
const chip: React.CSSProperties = {
  fontSize: 9,
  padding: "2px 6px",
  borderRadius: 20,
  background: "#1a1a0a",
  color: "#FAC775",
  border: "1px solid #FAC77533",
};
