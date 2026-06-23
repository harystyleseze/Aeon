// Shared request guard for the API: origin allowlist, rate limiting, wallet-signature
// auth, and an upload size cap. Used by both the Vercel functions and the Express dev
// server so the server-held keys (ROUTER_API_KEY, STORAGE_PRIVATE_KEY) can't be abused
// by anonymous callers.
//
// NOTE: the rate limiter is in-memory and therefore per-instance. On serverless it is a
// best-effort speed bump; the wallet-signature gate is the primary control. For hardened
// production, back the limiter with a shared store (e.g. Upstash/Redis).
import { verifyMessage } from "ethers";

export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 2 * 1024 * 1024); // 2 MB
const AUTH_TTL_MS = Number(process.env.AUTH_TTL_MS ?? 24 * 60 * 60 * 1000); // 24h
const SESSION_PREFIX = "Aeon session\nissued:";

export class GuardError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function allowedOrigins(): string[] {
  const fromEnv = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // Sensible local defaults; production origins should be set via ALLOWED_ORIGINS.
  return [
    "http://localhost:5173",
    "http://localhost:5180",
    "http://localhost:4173",
    ...fromEnv,
  ];
}

export function checkOrigin(origin?: string | null) {
  // Same-origin browser requests always send an Origin header for POST. We require it to
  // be allow-listed, which blocks casual cross-site and curl abuse.
  if (!origin) throw new GuardError(403, "origin required");
  const ok = allowedOrigins().some((o) => o === origin) || /\.vercel\.app$/.test(safeHost(origin));
  if (!ok) throw new GuardError(403, "origin not allowed");
}

function safeHost(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return "";
  }
}

// --- rate limiting (fixed window, in-memory) ---
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs = 60_000) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  b.count += 1;
  if (b.count > limit) throw new GuardError(429, "rate limit exceeded — slow down");
}

export function clientIp(headers: Record<string, any>): string {
  const xff = (headers["x-forwarded-for"] || headers["X-Forwarded-For"] || "") as string;
  return (xff.split(",")[0] || "local").trim();
}

// --- wallet-signature auth ---
// Token = base64(JSON{ address, issuedAt, signature }) where signature signs
// `Aeon session\nissued:<issuedAt>`. Reused across a session; bound to the wallet.
export function verifyAuth(token?: string | null): string {
  if (!token) throw new GuardError(401, "auth required");
  let parsed: { address?: string; issuedAt?: number; signature?: string };
  try {
    parsed = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
  } catch {
    throw new GuardError(401, "malformed auth token");
  }
  const { address, issuedAt, signature } = parsed;
  if (!address || !issuedAt || !signature) throw new GuardError(401, "incomplete auth token");
  const now = Date.now();
  if (issuedAt > now + 5 * 60_000 || now - issuedAt > AUTH_TTL_MS) {
    throw new GuardError(401, "auth token expired — reconnect your wallet");
  }
  let recovered: string;
  try {
    recovered = verifyMessage(`${SESSION_PREFIX}${issuedAt}`, signature);
  } catch {
    throw new GuardError(401, "invalid auth signature");
  }
  if (recovered.toLowerCase() !== String(address).toLowerCase()) {
    throw new GuardError(401, "auth signature does not match address");
  }
  return recovered;
}

export interface GuardInput {
  origin?: string | null;
  headers: Record<string, any>;
  authToken?: string | null;
  perMinute?: number; // per-address limit
}

/** Run the full guard for a mutating endpoint. Returns the authenticated address. */
export function guard({ origin, headers, authToken, perMinute = 20 }: GuardInput): string {
  checkOrigin(origin);
  rateLimit(`ip:${clientIp(headers)}`, perMinute * 3); // looser IP cap (shared NATs)
  const address = verifyAuth(authToken);
  rateLimit(`addr:${address}`, perMinute);
  return address;
}
