export interface MemoryPoint {
  root: string;
  txHash: string;
  at: number;
}

function short(s: string) {
  return s ? `${s.slice(0, 8)}…${s.slice(-6)}` : "—";
}

export function MemoryTimeline({ points }: { points: MemoryPoint[] }) {
  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">
        Memory timeline <span className="text-slate-400">— the companion's life, on-chain</span>
      </h3>
      {points.length === 0 ? (
        <p className="text-sm text-slate-400">No memories yet. Say hello.</p>
      ) : (
        <ol className="space-y-2">
          {points.map((p, i) => (
            <li key={i} className="flex items-center justify-between gap-3">
              <span className="chip" title={p.root}>
                root {short(p.root)}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(p.at).toLocaleTimeString()} · tx {short(p.txHash)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
