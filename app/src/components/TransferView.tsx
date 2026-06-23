import { useState } from "react";
import { Orb } from "./Orb";
import type { Companion } from "../types";

const FACTS = [
  "Ownership transfers on-chain via transferFrom — instant and verifiable.",
  "The encrypted memoryRoot stays attached to the token, so the seal is publicly verifiable.",
  "Under ERC-7857, a re-encryption oracle re-keys the memory for the new owner (planned).",
];

export function TransferView({
  companion,
  sealing,
  onTransfer,
}: {
  companion: Companion;
  sealing: boolean;
  onTransfer: (to: string) => void;
}) {
  const [to, setTo] = useState("");

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-16 pt-8">
      <div className="mx-auto flex max-w-[760px] flex-wrap items-start gap-9">
        <div className="min-w-[280px] flex-1 basis-[300px]">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[2.5px] text-accent">
            Transferable digital soul
          </div>
          <h2 className="m-0 mb-3.5 font-serif text-[32px] font-medium leading-[1.1]">Pass {companion.name} on</h2>
          <p className="m-0 mb-[18px] text-[15px] leading-[1.6] text-ink-soft">
            This is the part no chatbot can do. Transfer ownership to another wallet and {companion.name}'s
            encrypted memory stays attached to the token. Under ERC-7857, a re-encryption oracle re-keys that
            memory for the new owner so the identity persists.
          </p>
          <div className="flex flex-col gap-[11px]">
            {FACTS.map((f, i) => (
              <div key={i} className="flex gap-2.5 text-[13.5px] leading-[1.45] text-ink-soft">
                <span className="flex-none text-accent">→</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div
          className="min-w-[280px] flex-1 basis-[280px] rounded-[20px] border p-[26px]"
          style={{ background: "var(--panel)", borderColor: "var(--line)", boxShadow: "var(--shadow-lg)" }}
        >
          {!sealing ? (
            <>
              <div className="mb-[22px] flex flex-col items-center text-center">
                <div className="mb-3">
                  <Orb hue={companion.hue} size={70} small breathe={false} />
                </div>
                <div className="font-serif text-xl">
                  {companion.name} · #{companion.tokenId.toString()}
                </div>
              </div>
              <label className="mb-2 block text-[13px] font-semibold text-ink-soft">Recipient wallet</label>
              <input
                className="field mb-[18px] rounded-xl font-mono text-[13px]"
                style={{ background: "var(--panel2)" }}
                type="text"
                placeholder="0x…"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
              <button
                className="btn w-full"
                disabled={!to.trim().startsWith("0x")}
                onClick={() => onTransfer(to.trim())}
              >
                Seal memory & transfer →
              </button>
              <div className="mt-[11px] text-center text-[11.5px] leading-[1.4] text-muted">
                Irreversible. {companion.name} will belong to the recipient.
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-[18px] py-3.5 text-center">
              <div className="relative">
                <div
                  className="absolute rounded-full animate-spin"
                  style={{ inset: -16, border: "2px solid var(--accent)", borderTopColor: "transparent" }}
                />
                <Orb hue={companion.hue} size={80} small />
              </div>
              <div className="font-serif text-[21px]">Transferring…</div>
              <div className="flex w-full flex-col gap-2 text-left font-mono text-[12.5px] text-ink-soft">
                <div style={{ color: "var(--accent)" }}>◐ transferFrom → 0G Chain</div>
                <div className="text-muted">· re-encrypt memory for new owner (ERC-7857 oracle · planned)</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
