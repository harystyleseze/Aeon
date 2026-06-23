import type { VercelRequest, VercelResponse } from "@vercel/node";
import { chatComplete } from "./_lib/handlers";
import { readJsonBody } from "./_lib/body";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const body = await readJsonBody(req);
    const result = await chatComplete({ messages: body.messages, model: body.model });
    res.status(200).json(result);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "chat failed" });
  }
}
