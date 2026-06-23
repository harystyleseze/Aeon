export function TEEBadge({ verified }: { verified: boolean | null }) {
  if (verified === null) return null;
  return (
    <span
      className={`chip ${
        verified ? "text-emerald-300 ring-emerald-400/30" : "text-amber-300 ring-amber-400/30"
      }`}
      title={
        verified
          ? "Verified: this response ran in a 0G Compute TEE. The provider could not read your prompt."
          : "TEE signature not verified for this response."
      }
    >
      {verified ? "🔒 TEE-verified" : "⚠ TEE unverified"}
    </span>
  );
}
