import { Orb } from "../components/Orb";
import { BRAND_HUE } from "../lib/orb";

const PILLARS = [
  { tag: "CHAIN", k: "0G Chain", d: "Ownership & transfer live on-chain." },
  { tag: "INFT", k: "ERC-7857", d: "The companion is the token itself." },
  { tag: "COMPUTE", k: "0G Compute · TEE", d: "Provable private inference." },
  { tag: "STORAGE", k: "0G Storage", d: "Encrypted, ever-growing memory." },
];

export function Landing({ onConnect, connecting }: { onConnect: () => void; connecting: boolean }) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-16 text-center">
      <div className="mb-9">
        <Orb hue={BRAND_HUE} size={148} ring />
      </div>
      <div className="mb-[18px] text-xs font-semibold uppercase tracking-[3px] text-accent">
        An intelligent NFT on 0G
      </div>
      <h1
        className="m-0 mb-[22px] max-w-[14ch] font-serif font-medium leading-[1.02]"
        style={{ fontSize: "clamp(40px,6.4vw,78px)", letterSpacing: "-1px", textWrap: "balance" }}
      >
        Stop renting
        <br />
        <span className="italic text-accent">your AI.</span>
      </h1>
      <p className="m-0 mb-9 max-w-[52ch] text-lg leading-[1.6] text-ink-soft">
        You spend months teaching an AI who you are — then own none of it. Aeon is the first companion you truly
        own. It remembers privately, grows over time, and can be gifted, sold, or passed down. Because it lives
        on-chain.
      </p>
      <button className="btn text-base" onClick={onConnect} disabled={connecting}>
        {connecting ? "Connecting…" : "Connect wallet to begin →"}
      </button>
      <div className="mt-4 text-[13px] text-muted">Own it · grow it · pass it on</div>

      <div className="mt-16 grid w-full max-w-[880px] grid-cols-2 gap-3.5 md:grid-cols-4">
        {PILLARS.map((p) => (
          <div key={p.tag} className="card text-left">
            <div className="mb-2 font-mono text-xs font-bold text-accent">{p.tag}</div>
            <div className="mb-1 text-[14.5px] font-semibold">{p.k}</div>
            <div className="text-[13px] leading-[1.45] text-ink-soft">{p.d}</div>
          </div>
        ))}
      </div>
      <div className="mt-[30px] max-w-[60ch] text-xs leading-[1.5] text-muted">
        Remove any one pillar and Aeon collapses into a generic chatbot. All four are load-bearing.
      </div>
    </main>
  );
}
