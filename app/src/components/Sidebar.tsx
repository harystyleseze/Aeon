import { Orb } from "./Orb";
import type { Companion, MemoryPoint } from "../types";

function shortAddr(a: string) {
  return a ? a.slice(0, 6) + "…" + a.slice(-4) : "";
}
function shortRoot(r: string) {
  return r ? r.slice(0, 16) + "…" + r.slice(-6) : "—";
}

const STATUS = ["0G Chain · ownership", "INFT · ERC-7857", "0G Compute · TEE", "0G Storage · memory"];

export function Sidebar({
  companion,
  essenceTag,
  owned,
  memory,
  sizeKB,
}: {
  companion: Companion;
  essenceTag: string;
  owned: boolean;
  memory: MemoryPoint[];
  sizeKB: number;
}) {
  const currentRoot = memory.length ? memory[memory.length - 1].root : "";
  return (
    <aside
      className="flex w-[312px] flex-none flex-col gap-[22px] overflow-y-auto border-r p-7"
      style={{ borderColor: "var(--line)", background: "var(--bg2)" }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4">
          <Orb hue={companion.hue} size={104} />
        </div>
        <div className="font-serif text-[27px] leading-none">{companion.name}</div>
        <div className="mt-[5px] text-[13px] font-semibold text-accent">{essenceTag}</div>
      </div>

      <div className="card flex flex-col gap-[11px] rounded-[14px] px-4 py-[15px]">
        <Row label="Token" value={`#${companion.tokenId.toString()}`} mono bold />
        <Divider />
        <Row label="Standard" value="ERC-7857" mono />
        <Divider />
        <Row label="Owner" value={shortAddr(companion.owner)} mono valueColor={owned ? "var(--ink-soft)" : "var(--accent)"} />
      </div>

      <div className="card rounded-[14px] px-4 py-[15px]">
        <div className="mb-3 text-[11px] uppercase tracking-[1.4px] text-muted">Encrypted memory · 0G Storage</div>
        <div className="mb-[13px] flex gap-[18px]">
          <div>
            <div className="font-serif text-[26px] leading-none">{memory.length}</div>
            <div className="text-[11.5px] text-muted">memories</div>
          </div>
          <div>
            <div className="font-serif text-[26px] leading-none">{sizeKB.toFixed(1)}KB</div>
            <div className="text-[11.5px] text-muted">sealed</div>
          </div>
        </div>
        <div className="mb-1 text-[11px] text-muted">Current memory root</div>
        <div className="break-all font-mono text-[11.5px] leading-[1.4] text-accent">{shortRoot(currentRoot)}</div>
      </div>

      <div className="flex flex-col gap-2">
        {STATUS.map((s) => (
          <div key={s} className="flex items-center gap-[9px] text-[13px] text-ink-soft">
            <span
              className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: "var(--good-tint)", color: "var(--good)" }}
            >
              ✓
            </span>
            {s}
          </div>
        ))}
      </div>
    </aside>
  );
}

function Row({
  label,
  value,
  mono,
  bold,
  valueColor,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span className={`${mono ? "font-mono" : ""} ${bold ? "font-bold" : ""}`} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
    </div>
  );
}
function Divider() {
  return <div className="h-px" style={{ background: "var(--line)" }} />;
}
