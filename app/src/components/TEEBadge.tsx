export function TEEBadge({
  verified,
  attestation,
  time,
}: {
  verified: boolean | null;
  attestation?: string;
  time?: string;
}) {
  if (verified === null || verified === undefined) return null;
  const attShort = attestation ? attestation.slice(0, 8) + "…" : "";
  return (
    <div className="mt-[7px] flex items-center gap-[7px] font-mono text-[11px]" style={{ color: verified ? "var(--good)" : "var(--muted)" }}>
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-[3px]"
        style={{ background: verified ? "var(--good-tint)" : "var(--panel2)" }}
        title={
          verified
            ? "Verified: this response ran in a 0G Compute TEE. The provider could not read your prompt."
            : "TEE signature not verified for this response."
        }
      >
        <span>{verified ? "🔒" : "⚠"}</span>
        {verified ? "TEE-verified" : "TEE unverified"}
      </span>
      {attShort && <span className="text-muted">attestation {attShort}</span>}
      {time && <span className="text-muted">· {time}</span>}
    </div>
  );
}
