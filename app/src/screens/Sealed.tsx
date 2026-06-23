import { Orb } from "../components/Orb";
import type { Companion } from "../types";

function shortAddr(a: string) {
  return a ? a.slice(0, 6) + "…" + a.slice(-4) : "";
}

export function Sealed({
  companion,
  memoryCount,
  sealedRoot,
  transferTx,
  onMintNew,
}: {
  companion: Companion;
  memoryCount: number;
  sealedRoot: string;
  transferTx: string;
  onMintNew: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-[26px]">
        <Orb hue={companion.hue} size={110} breathe={false} sealed />
      </div>
      <div className="mb-3.5 text-xs font-semibold uppercase tracking-[2.5px]" style={{ color: "var(--good)" }}>
        Transfer complete · memory sealed
      </div>
      <h2
        className="m-0 mb-3.5 max-w-[18ch] font-serif font-medium leading-[1.1]"
        style={{ fontSize: "clamp(28px,4vw,40px)" }}
      >
        {companion.name} now belongs to someone else
      </h2>
      <p className="m-0 mb-[26px] max-w-[52ch] text-[15.5px] leading-[1.6] text-ink-soft">
        Ownership moved to <span className="font-mono text-ink">{shortAddr(companion.owner)}</span> on 0G Chain.
        {companion.name}'s {memoryCount} encrypted {memoryCount === 1 ? "memory" : "memories"} stay attached to
        the token. To you they're now sealed — verifiable, but unreadable. Re-encryption for the new owner is
        handled by the ERC-7857 oracle (planned).
      </p>

      <div className="card mb-[18px] w-full max-w-[460px] rounded-[14px] px-5 py-4 text-left">
        <div className="mb-2 text-[11px] uppercase tracking-[1.4px] text-muted">Sealed memory root</div>
        <div className="break-all font-mono text-xs leading-[1.5] text-accent">{sealedRoot || "—"}</div>
      </div>
      {transferTx && (
        <div className="mb-[30px] font-mono text-[11px] text-muted">transfer tx: {transferTx.slice(0, 18)}…</div>
      )}

      <button className="btn" onClick={onMintNew}>
        Mint a new companion →
      </button>
    </div>
  );
}
