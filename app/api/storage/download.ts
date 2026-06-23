import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storageDownload } from "../_lib/handlers";
import { guard, GuardError } from "../_lib/guard";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });
  try {
    guard({ origin: req.headers.origin, headers: req.headers, authToken: req.headers["x-aeon-auth"] as string, perMinute: 30 });
    const root = String(req.query.root || "");
    const result = await storageDownload(root);
    res.status(200).json(result);
  } catch (e: any) {
    res.status(e instanceof GuardError ? e.status : 500).json({ error: e?.message || "download failed" });
  }
}
