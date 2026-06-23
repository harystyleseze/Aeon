import { useState } from "react";

export function TransferModal({
  open,
  onClose,
  onTransfer,
}: {
  open: boolean;
  onClose: () => void;
  onTransfer: (to: string) => Promise<void>;
}) {
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
      <div className="card w-full max-w-md">
        <h3 className="text-lg font-semibold">Give your companion away</h3>
        <p className="mt-1 text-sm text-slate-400">
          Transfer ownership on 0G Chain. Its encrypted soul travels with it — re-sealed for the new
          owner by the re-encryption oracle.
        </p>
        <input
          className="mt-4 w-full rounded-xl bg-black/40 px-3 py-2 font-mono text-sm ring-1 ring-white/10 outline-none"
          placeholder="recipient 0x address"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button className="text-sm text-slate-400" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn"
            disabled={busy || !to.startsWith("0x")}
            onClick={async () => {
              setBusy(true);
              try {
                await onTransfer(to);
                onClose();
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Transferring…" : "Transfer"}
          </button>
        </div>
      </div>
    </div>
  );
}
