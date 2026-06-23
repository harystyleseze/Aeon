import { orb } from "../lib/orb";

export interface MintStep {
  label: string;
  // 'done' | 'active' | 'pending'
  state: "done" | "active" | "pending";
}

export function MintingOverlay({ hue, steps, title }: { hue: number; steps: MintStep[]; title: string }) {
  const o = orb(hue);
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-7"
      style={{ background: "var(--bg)" }}
    >
      <div className="relative">
        <div
          className="absolute rounded-full animate-spin"
          style={{ inset: -22, border: "2px solid var(--accent)", borderTopColor: "transparent" }}
        />
        <div
          className="h-[120px] w-[120px] rounded-full animate-breathe"
          style={{ background: o.bg, boxShadow: o.glow }}
        />
      </div>
      <div className="font-serif text-2xl">{title}</div>
      <div className="flex w-[320px] flex-col gap-2.5">
        {steps.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 font-mono text-[13.5px]"
            style={{
              color:
                s.state === "done" ? "var(--good)" : s.state === "active" ? "var(--accent)" : "var(--muted)",
            }}
          >
            <span className="w-4 text-center">
              {s.state === "done" ? "✓" : s.state === "active" ? "◐" : "·"}
            </span>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
