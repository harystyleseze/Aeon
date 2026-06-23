import { orb, BRAND_HUE } from "../lib/orb";

interface TopBarProps {
  addressShort?: string;
  theme: "dusk" | "hearth";
  onToggleTheme: () => void;
}

export function TopBar({ addressShort, theme, onToggleTheme }: TopBarProps) {
  const b = orb(BRAND_HUE);
  return (
    <header
      className="sticky top-0 z-40 flex h-16 flex-none items-center justify-between border-b px-6"
      style={{ borderColor: "var(--line)", background: "var(--bg)" }}
    >
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded-full" style={{ background: b.bg, boxShadow: b.glowSm }} />
        <span className="font-serif text-[23px] italic tracking-[.3px]">aeon</span>
        <span
          className="ml-1.5 rounded-full border px-2 py-[3px] text-[10.5px] uppercase tracking-[1.5px]"
          style={{ color: "var(--muted)", borderColor: "var(--line2)" }}
        >
          INFT · 0G
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        {addressShort && (
          <div className="chip font-mono text-[12.5px]">
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: "var(--good)" }} />
            {addressShort}
          </div>
        )}
        <button className="btn-ghost flex items-center gap-1.5" onClick={onToggleTheme}>
          {theme === "hearth" ? "☾  Dusk" : "☀  Hearth"}
        </button>
      </div>
    </header>
  );
}
