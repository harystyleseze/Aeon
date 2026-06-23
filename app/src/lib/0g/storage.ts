import { CONFIG } from "../../config";
import { authHeaders } from "../auth";

/**
 * 0G Storage via the server API.
 *
 * The 0G Storage SDK is Node-only (filesystem/streams), so uploads/downloads run
 * on the server (app/api/storage/*). The browser only ever sends/receives
 * ciphertext — the client encrypts (ECIES) before upload and decrypts after
 * download, so the server cannot read memory contents.
 */

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Upload encrypted bytes; returns the 0G Storage root hash (bytes32 hex) + tx. */
export async function uploadEncrypted(data: Uint8Array): Promise<{ rootHash: string; txHash: string }> {
  const res = await fetch(`${CONFIG.API_BASE}/api/storage/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ data: bytesToB64(data) }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "storage upload failed");
  return json;
}

/** Download encrypted bytes by root hash. */
export async function downloadEncrypted(rootHash: string): Promise<Uint8Array> {
  const res = await fetch(`${CONFIG.API_BASE}/api/storage/download?root=${encodeURIComponent(rootHash)}`, {
    headers: { ...authHeaders() },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "storage download failed");
  return b64ToBytes(json.dataB64);
}
