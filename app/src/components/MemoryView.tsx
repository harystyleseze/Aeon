import type { MemoryPoint } from "../types";

function shortTime(at: number) {
  return new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MemoryView({ memory }: { memory: MemoryPoint[] }) {
  const rows = [...memory].reverse();
  return (
    <div className="flex-1 overflow-y-auto px-8 pb-16 pt-8">
      <div className="mx-auto max-w-[720px]">
        <h2 className="m-0 mb-1.5 font-serif text-[32px] font-medium">Memory, growing on-chain</h2>
        <p className="m-0 mb-[26px] text-[15px] leading-[1.55] text-ink-soft">
          Every conversation is encrypted and written to 0G Storage. Each seal updates an on-chain{" "}
          <span className="font-mono text-accent">memoryRoot</span> — a receipt of your companion's life that
          travels with the token.
        </p>

        {rows.length === 0 ? (
          <div className="card text-sm text-ink-soft">No memories sealed yet. Start a conversation.</div>
        ) : (
          <div className="relative pl-[30px]">
            <div className="absolute bottom-1.5 left-[9px] top-1.5 w-0.5" style={{ background: "var(--line2)" }} />
            {rows.map((ev, i) => (
              <div key={i} className="relative mb-5">
                <div
                  className="absolute left-[-29px] top-1 h-5 w-5 rounded-full"
                  style={{
                    background: ev.genesis ? "var(--accent)" : "var(--good)",
                    border: "3px solid var(--bg)",
                    boxShadow: "0 0 0 1px var(--line2)",
                  }}
                />
                <div className="card rounded-[14px] px-[18px] py-[15px]">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <span className="text-[15px] font-semibold">{ev.label}</span>
                    <span className="flex-none font-mono text-xs text-muted">{shortTime(ev.at)}</span>
                  </div>
                  <div className="mb-[9px] flex flex-wrap gap-4 text-xs text-ink-soft">
                    <span>📦 {ev.size} encrypted</span>
                    <span style={{ color: "var(--good)" }}>✓ written to 0G Chain</span>
                  </div>
                  <div
                    className="break-all rounded-lg px-2.5 py-2 font-mono text-[11.5px] text-accent"
                    style={{ background: "var(--panel2)" }}
                  >
                    {ev.root}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
