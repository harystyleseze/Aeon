import { CONFIG } from "../../config";
import { authHeaders } from "../auth";

/**
 * Chat via the server API, which proxies to the 0G Compute Router
 * (OpenAI-compatible). The router runs inference inside a TEE enclave; the
 * app-sk API key is held server-side and never exposed to the browser.
 */

export interface ChatResult {
  content: string;
  provider: string;
  tee: boolean;
}

export async function chat(messages: { role: string; content: string }[], model?: string): Promise<ChatResult> {
  const res = await fetch(`${CONFIG.API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ messages, model }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "chat failed");
  return json;
}
