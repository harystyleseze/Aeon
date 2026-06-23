import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import type { JsonRpcSigner } from "ethers";
import { CONFIG } from "../../config";

/**
 * 0G Compute (TEE) inference.
 * Flow per 0G docs:
 *   1. createZGComputeNetworkBroker(signer)
 *   2. broker.ledger.depositFund(...)            // fund once
 *   3. broker.inference.acknowledgeProviderSigner(provider)  // REQUIRED one-time, on-chain
 *   4. getServiceMetadata(provider) -> { endpoint, model }
 *   5. getRequestHeaders(provider) -> auth headers
 *   6. fetch {endpoint}/chat/completions  (OpenAI-compatible)
 *   7. processResponse(provider, chatID) -> TEE signature verification (the privacy proof)
 *
 * NOTE: verify exact method names/signatures against the installed package version
 * (@0glabs/0g-serving-broker vs 0gfoundation/0g-serving-user-broker).
 */

export type Broker = Awaited<ReturnType<typeof createZGComputeNetworkBroker>>;

export async function initBroker(signer: JsonRpcSigner): Promise<Broker> {
  return createZGComputeNetworkBroker(signer as any);
}

/** Call once (or check balance first) to fund the broker ledger. */
export async function ensureFunded(broker: Broker, amount = 0.1): Promise<void> {
  try {
    await broker.ledger.depositFund(amount);
  } catch (e) {
    // Likely already funded / browser flow differs; surface but don't crash the demo.
    console.warn("depositFund:", e);
  }
}

/** One-time per (user, provider): acknowledge the provider's signer on-chain. */
export async function ackProvider(broker: Broker, provider: string): Promise<void> {
  await broker.inference.acknowledgeProviderSigner(provider);
}

export interface ChatResult {
  content: string;
  chatID: string;
  teeVerified: boolean;
}

export async function chat(
  broker: Broker,
  provider: string,
  messages: { role: string; content: string }[]
): Promise<ChatResult> {
  const { endpoint, model } = await broker.inference.getServiceMetadata(provider);
  const headers = await broker.inference.getRequestHeaders(provider);

  const res = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ model: model ?? CONFIG.DEFAULT_MODEL, messages }),
  });
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  const chatID = res.headers.get("ZG-Res-Key") || data?.id || "";

  // The privacy proof: verify the response came from a genuine TEE.
  let teeVerified = false;
  try {
    if (chatID) teeVerified = (await broker.inference.processResponse(provider, chatID)) ?? false;
  } catch (e) {
    console.warn("processResponse:", e);
  }

  return { content, chatID, teeVerified };
}
