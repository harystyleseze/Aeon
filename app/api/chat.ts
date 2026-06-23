import type { VercelRequest, VercelResponse } from "@vercel/node";
import { chatComplete } from "./_lib/handlers";
import { readJsonBody } from "./_lib/body";
import { guard, GuardError } from "./_lib/guard";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    guard({ origin: req.headers.origin, headers: req.headers, authToken: req.headers["x-aeon-auth"] as string, perMinute: 20 });
    const body = await readJsonBody(req);
    const result = await chatComplete({ messages: body.messages, model: body.model });
    res.status(200).json(result);
  } catch (e: any) {
    res.status(e instanceof GuardError ? e.status : 500).json({ error: e?.message || "chat failed" });
  }
}
