import { useState } from "react";
import { PORTRAITS, USE_IMAGES } from "../data/visuals";

interface Props {
    name: string;
    size: number;
    /** "bust": figura de cuerpo a la altura de la escena. "avatar": círculo recortado a la cara */
    variant?: "bust" | "avatar";
    dim?: boolean;
}

export function Portrait({ name, size, variant = "avatar", dim = false }: Props) {
    const [failed, setFailed] = useState(false);
    const v = PORTRAITS[name];
    if (!v) return null;

    const showImg = USE_IMAGES && !!v.src && !failed;
    const isBust = variant === "bust";
    const w = size;
    const h = isBust ? Math.round(size * 1.25) : size;

    return (
        <div
            title={name}
            style={{
                width: w,
                height: h,
                flexShrink: 0,
                borderRadius: isBust ? 10 : "50%",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `linear-gradient(160deg, ${v.color}33, #0d0d1a)`,
                border: `1px solid ${v.color}66`,
                boxShadow: dim ? "none" : `0 0 14px ${v.color}44`,
                filter: dim ? "brightness(0.45) saturate(0.7)" : "none",
                transition: "filter 0.25s, box-shadow 0.25s",
            }}
        >
            {showImg ? (
                <img
                    src={v.src}
                    alt={name}
                    onError={() => setFailed(true)}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: isBust ? "contain" : "cover",
                        objectPosition: isBust ? "bottom" : "top",
                    }}
                />
            ) : (
                <span style={{ fontSize: Math.round(w * (isBust ? 0.5 : 0.55)) }}>{v.icon}</span>
            )}
        </div>
    );
}