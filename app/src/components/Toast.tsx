export function Toast({ root }: { root: string }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 animate-fadeUp items-center gap-2.5 rounded-full px-[18px] py-[11px]"
      style={{ background: "var(--ink)", color: "var(--bg)", boxShadow: "var(--shadow-lg)" }}
    >
      <span className="text-sm">🧠</span>
      <span className="text-[13px] font-semibold">Memory updated</span>
      <span className="font-mono text-xs opacity-80">→ {root ? root.slice(0, 14) + "…" : ""}</span>
    </div>
  );
}
