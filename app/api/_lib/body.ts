import type { VercelRequest } from "@vercel/node";

// Reliably read a JSON body whether or not the runtime pre-parsed it.
export async function readJsonBody(req: VercelRequest): Promise<any> {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.length) {
    try {
      return JSON.parse(req.body);
    } catch {
      /* fall through to stream */
    }
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req as any) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
