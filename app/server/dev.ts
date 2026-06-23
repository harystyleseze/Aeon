// Local dev API server. Mirrors the Vercel functions in app/api/* using the
// same shared handlers, so `npm run dev` gives a full end-to-end local stack.
import "dotenv/config";
import express from "express";
import { chatComplete, storageUpload, storageDownload } from "../api/_lib/handlers";

const app = express();
app.use(express.json({ limit: "25mb" }));

app.post("/api/chat", async (req, res) => {
  try {
    res.json(await chatComplete({ messages: req.body?.messages, model: req.body?.model }));
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "chat failed" });
  }
});

app.post("/api/storage/upload", async (req, res) => {
  try {
    res.json(await storageUpload(req.body?.data));
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "upload failed" });
  }
});

app.get("/api/storage/download", async (req, res) => {
  try {
    res.json(await storageDownload(String(req.query.root || "")));
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "download failed" });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.API_PORT || 8787);
app.listen(PORT, () => console.log(`[aeon] dev API on http://localhost:${PORT}`));
