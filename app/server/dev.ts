// Local dev API server. Mirrors the Vercel functions in app/api/* using the
// same shared handlers + guard, so `npm run dev` gives a full end-to-end local stack.
import "dotenv/config";
import express from "express";
import { chatComplete, storageUpload, storageDownload } from "../api/_lib/handlers";
import { guard, GuardError } from "../api/_lib/guard";

const app = express();
app.use(express.json({ limit: "3mb" }));

function fail(res: express.Response, e: any) {
  res.status(e instanceof GuardError ? e.status : 500).json({ error: e?.message || "error" });
}

app.post("/api/chat", async (req, res) => {
  try {
    guard({ origin: req.headers.origin, headers: req.headers, authToken: req.headers["x-aeon-auth"] as string, perMinute: 20 });
    res.json(await chatComplete({ messages: req.body?.messages, model: req.body?.model }));
  } catch (e: any) {
    fail(res, e);
  }
});

app.post("/api/storage/upload", async (req, res) => {
  try {
    guard({ origin: req.headers.origin, headers: req.headers, authToken: req.headers["x-aeon-auth"] as string, perMinute: 30 });
    res.json(await storageUpload(req.body?.data));
  } catch (e: any) {
    fail(res, e);
  }
});

app.get("/api/storage/download", async (req, res) => {
  try {
    guard({ origin: req.headers.origin, headers: req.headers, authToken: req.headers["x-aeon-auth"] as string, perMinute: 30 });
    res.json(await storageDownload(String(req.query.root || "")));
  } catch (e: any) {
    fail(res, e);
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.API_PORT || 8787);
app.listen(PORT, () => console.log(`[aeon] dev API on http://localhost:${PORT}`));
