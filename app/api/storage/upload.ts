import type { VercelRequest, VercelResponse } from "@vercel/node";
import { storageUpload } from "../_lib/handlers";
import { readJsonBody } from "../_lib/body";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const body = await readJsonBody(req);
    const result = await storageUpload(body.data);
    res.status(200).json(result);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "upload failed" });
  }
}
