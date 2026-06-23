import { orb } from "../lib/orb";

interface OrbProps {
  hue: number;
  size?: number;
  breathe?: boolean;
  small?: boolean; // use the smaller glow
  highlight?: boolean; // soft white highlight
  ring?: boolean; // pulsing accent ring (landing hero)
  sealed?: boolean; // grayscale + lock (post-transfer)
  className?: string;
}

export function Orb({
  hue,
  size = 120,
  breathe = true,
  small = false,
  highlight = true,
  ring = false,
  sealed = false,
  className = "",
}: OrbProps) {
  const o = orb(hue);
  return (
    <div className={`relative ${ring ? "animate-floaty" : ""} ${className}`} style={{ width: size, height: size }}>
      {ring && (
        <div
          className="absolute rounded-full animate-pulseRing"
          style={{ inset: -30, border: "1px solid var(--accent)" }}
        />
      )}
      <div
        className={`relative rounded-full ${breathe ? "animate-breathe" : ""}`}
        style={{
          width: size,
          height: size,
          background: o.bg,
          boxShadow: sealed ? "none" : small ? o.glowSm : o.glow,
          filter: sealed ? "grayscale(.55) brightness(.78)" : undefined,
        }}
      >
        {highlight && !sealed && (
          <div
            className="absolute rounded-full"
            style={{
              top: "18%",
              left: "24%",
              width: "34%",
              height: "34%",
              background: "radial-gradient(circle, rgba(255,255,255,.7), transparent 70%)",
              filter: "blur(3px)",
            }}
          />
        )}
        {sealed && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full text-3xl"
            style={{ background: "rgba(0,0,0,.28)" }}
          >
            🔒
          </div>
        )}
      </div>
    </div>
  );
}
