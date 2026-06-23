import { useState } from "react";
import { Orb } from "../components/Orb";
import { orb } from "../lib/orb";
import { ESSENCES, essenceById } from "../data/essences";

interface MintProps {
  name: string;
  onName: (v: string) => void;
  essenceId: string;
  onEssence: (id: string) => void;
  custom: string;
  onCustom: (v: string) => void;
  onMint: () => void;
  canMint: boolean;
}

export function Mint({ name, onName, essenceId, onEssence, custom, onCustom, onMint, canMint }: MintProps) {
  const [showCustom, setShowCustom] = useState(false);
  const e = essenceById(essenceId);
  const previewName = name.trim() || e.name;

  return (
    <main className="relative flex flex-1 flex-col items-center px-6 pb-20 pt-12">
      <div className="mb-3.5 text-xs font-semibold uppercase tracking-[3px] text-accent">Mint your companion</div>
      <h1
        className="m-0 mb-3 text-center font-serif font-medium leading-[1.05]"
        style={{ fontSize: "clamp(32px,4.6vw,52px)", letterSpacing: "-.5px" }}
      >
        Give your Aeon a soul
      </h1>
      <p className="m-0 mb-9 max-w-[48ch] text-center text-base leading-[1.55] text-ink-soft">
        Name it and choose its essence. We mint it as an Intelligent NFT — yours, on-chain, forever.
      </p>

      <div className="flex w-full max-w-[960px] flex-wrap items-start justify-center gap-9">
        {/* preview */}
        <div className="card flex w-[280px] flex-none flex-col items-center rounded-[22px] px-7 py-8">
          <div className="mb-[22px]">
            <Orb hue={e.hue} size={130} />
          </div>
          <div className="mb-1 font-serif text-[26px]">{previewName}</div>
          <div className="mb-[18px] text-[13.5px] font-semibold text-accent">{e.tag}</div>
          <div className="text-center font-serif text-[13px] italic leading-[1.5] text-ink-soft">
            “{e.line}”
          </div>
        </div>

        {/* form */}
        <div className="min-w-[300px] flex-1 basis-[360px]">
          <label className="mb-2 block text-[13px] font-semibold text-ink-soft">Name your companion</label>
          <input
            className="field mb-[26px] font-serif text-xl"
            type="text"
            placeholder="e.g. Lumen"
            value={name}
            onChange={(ev) => onName(ev.target.value)}
          />

          <label className="mb-[11px] block text-[13px] font-semibold text-ink-soft">Choose an essence</label>
          <div className="grid grid-cols-2 gap-3">
            {ESSENCES.map((es) => {
              const o = orb(es.hue);
              const sel = es.id === essenceId;
              return (
                <div
                  key={es.id}
                  onClick={() => onEssence(es.id)}
                  className="flex cursor-pointer items-center gap-3 rounded-[14px] border p-3.5 transition"
                  style={{
                    borderColor: sel ? "var(--accent)" : "var(--line2)",
                    background: sel ? "var(--accent-tint)" : "var(--panel)",
                    borderWidth: 1.5,
                  }}
                >
                  <div className="h-[34px] w-[34px] flex-none rounded-full" style={{ background: o.bg, boxShadow: o.glowSm }} />
                  <div>
                    <div className="text-[15px] font-semibold">{es.name}</div>
                    <div className="text-xs text-ink-soft">{es.tag}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="mt-3.5 text-[13px] font-semibold text-accent"
            onClick={() => setShowCustom((v) => !v)}
          >
            {showCustom ? "− Hide custom persona" : "+ Advanced: write a custom persona"}
          </button>
          {showCustom && (
            <textarea
              className="field mt-2.5 text-sm"
              rows={3}
              placeholder="Describe your companion's personality. This becomes its system prompt and overrides the essence."
              value={custom}
              onChange={(ev) => onCustom(ev.target.value)}
            />
          )}

          <button className="btn mt-[26px] w-full" onClick={onMint} disabled={!canMint}>
            {canMint ? "Mint Aeon as INFT →" : "Connect wallet first"}
          </button>
          <div className="mt-3 text-center font-mono text-xs text-muted">
            ERC-7857 · 0G Chain · gas estimated ~0.0002 0G
          </div>
        </div>
      </div>
    </main>
  );
}
