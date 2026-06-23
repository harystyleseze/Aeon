// Framework-agnostic server handlers. Used by both the Vercel functions
// (app/api/*) and the local Express dev server (app/server/dev.ts).
//
// Secrets live ONLY here (server-side, read from process.env). The client never
// sees ROUTER_API_KEY or STORAGE_PRIVATE_KEY.
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { ethers } from "ethers";
import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";

const env = (k: string, fallback = "") => process.env[k] ?? fallback;

const ROUTER_BASE = () => env("ROUTER_BASE", "https://router-api-testnet.integratenetwork.work/v1");
const ROUTER_API_KEY = () => env("ROUTER_API_KEY");
const ROUTER_MODEL = () => env("ROUTER_MODEL", "llama-3.3-70b-instruct");
const ZG_RPC = () => env("ZG_RPC", "https://evmrpc-testnet.0g.ai");
const INDEXER_RPC = () => env("INDEXER_RPC", "https://indexer-storage-testnet-turbo.0g.ai");
const STORAGE_PRIVATE_KEY = () => env("STORAGE_PRIVATE_KEY");

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatResult {
  content: string;
  provider: string;
  tee: boolean;
}

/** Proxy a chat completion to the 0G Compute Router (OpenAI-compatible). */
export async function chatComplete(input: { messages: ChatMessage[]; model?: string }): Promise<ChatResult> {
  if (!ROUTER_API_KEY()) {
    throw new Error("ROUTER_API_KEY is not set. Create an app-sk key at pc.testnet.0g.ai and set it in the server env.");
  }
  if (!Array.isArray(input?.messages) || input.messages.length === 0) {
    throw new Error("messages[] is required");
  }
  const res = await fetch(`${ROUTER_BASE()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ROUTER_API_KEY()}`,
    },
    body: JSON.stringify({
      model: input.model || ROUTER_MODEL(),
      messages: input.messages,
      stream: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Compute Router error ${res.status}: ${text.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  // The router runs inference inside a TEE enclave (privacy property of the service).
  return { content, provider: "0G Compute Router", tee: true };
}

function storageSigner(): ethers.Wallet {
  const key = STORAGE_PRIVATE_KEY();
  if (!key) throw new Error("STORAGE_PRIVATE_KEY is not set. Fund a testnet wallet at faucet.0g.ai and set it in the server env.");
  const provider = new ethers.JsonRpcProvider(ZG_RPC());
  return new ethers.Wallet(key, provider);
}

/** Upload already-encrypted bytes (base64) to 0G Storage; return the root hash. */
export async function storageUpload(bytesB64: string): Promise<{ rootHash: string; txHash: string }> {
  if (!bytesB64) throw new Error("data (base64) is required");
  const bytes = Buffer.from(bytesB64, "base64");
  const indexer = new Indexer(INDEXER_RPC());
  const mem = new MemData(bytes);
  const [tree, treeErr] = await mem.merkleTree();
  if (treeErr) throw new Error(`merkleTree failed: ${treeErr}`);
  const rootHash: string = (tree as any)?.rootHash?.() ?? "";
  const [tx, uploadErr] = await indexer.upload(mem as any, ZG_RPC(), storageSigner() as any);
  if (uploadErr) throw new Error(`upload failed: ${uploadErr}`);
  return { rootHash: String(rootHash), txHash: String((tx as any)?.txHash ?? tx ?? "") };
}

/** Download bytes from 0G Storage by root hash; return as base64. */
export async function storageDownload(root: string): Promise<{ dataB64: string }> {
  if (!root) throw new Error("root is required");
  const indexer = new Indexer(INDEXER_RPC());
  const tmp = path.join(os.tmpdir(), `aeon-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`);
  const err = await indexer.download(root, tmp, true);
  if (err) throw new Error(`download failed: ${err}`);
  try {
    const buf = await fs.readFile(tmp);
    return { dataB64: buf.toString("base64") };
  } finally {
    await fs.unlink(tmp).catch(() => {});
  }
}
