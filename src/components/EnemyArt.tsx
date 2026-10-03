import { useState } from "react";
import { USE_IMAGES } from "../data/visuals";

export function EnemyArt({ id, fallback, size, dead }: { id: string; fallback: string; size: number; dead?: boolean }) {
    const [failed, setFailed] = useState(false);
    if (!USE_IMAGES || failed) return <span style={{ fontSize: Math.round(size * 0.45) }}>{dead ? "💀" : fallback}</span>;
    return (
        <img
            src={`/art/enemies/${id}.webp`}
            alt=""
            onError={() => setFailed(true)}
            style={{
                width: size, height: size, objectFit: "contain", objectPosition: "bottom",
                filter: dead ? "grayscale(1) brightness(0.4)" : "none",
            }}
        />
    );
}