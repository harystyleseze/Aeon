export function TEEBadge({
  verified,
  time,
}: {
  verified: boolean | null;
  attestation?: string;
  time?: string;
}) {
  if (verified === null || verified === undefined) return null;
  return (
    <div
      className="mt-[7px] flex items-center gap-[7px] font-mono text-[11px]"
      style={{ color: verified ? "var(--good)" : "var(--muted)" }}
    >
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-[3px]"
        style={{ background: verified ? "var(--good-tint)" : "var(--panel2)" }}
        title={
          verified
            ? "Private: this response was generated inside a 0G Compute Router TEE enclave. The inference provider cannot read your prompt."
            : "This response was not processed via the 0G Compute Router TEE."
        }
      >
        <span>{verified ? "🔒" : "⚠"}</span>
        {verified ? "Private · 0G TEE" : "not private"}
      </span>
      {verified && <span className="text-muted">0G Compute Router</span>}
      {time && <span className="text-muted">· {time}</span>}
    </div>
  );
}
