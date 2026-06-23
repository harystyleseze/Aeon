import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storageDownload } from "../_lib/handlers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });
  try {
    const root = String(req.query.root || "");
    const result = await storageDownload(root);
    res.status(200).json(result);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "download failed" });
  }
}
