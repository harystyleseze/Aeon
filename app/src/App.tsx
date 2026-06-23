import { useState } from "react";
import { JsonRpcSigner, ZeroHash, hashMessage, SigningKey, getBytes, hexlify } from "ethers";
import { getSigner, mintCompanion, updateMemoryRoot, transferCompanion } from "./lib/0g/chain";
import { initBroker, ensureFunded, ackProvider, chat, type Broker } from "./lib/0g/compute";
import { uploadEncrypted } from "./lib/0g/storage";
import { encryptForPubKey } from "./lib/0g/crypto";
import { CONFIG } from "./config";
import { TEEBadge } from "./components/TEEBadge";
import { MemoryTimeline, type MemoryPoint } from "./components/MemoryTimeline";
import { TransferModal } from "./components/TransferModal";

type Msg = { role: "user" | "assistant"; content: string; tee?: boolean | null };

export default function App() {
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [addr, setAddr] = useState("");
  const [pubKey, setPubKey] = useState("");
  const [broker, setBroker] = useState<Broker | null>(null);

  const [persona, setPersona] = useState("A warm, curious companion who remembers what matters to me.");
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [mintTx, setMintTx] = useState("");

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [memory, setMemory] = useState<MemoryPoint[]>([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [status, setStatus] = useState("");

  async function connect() {
    const s = await getSigner();
    const a = await s.getAddress();
    // Recover the user's secp256k1 public key from a signature (for ECIES memory encryption).
    const msg = "Aeon: derive my companion encryption key";
    const sig = await s.signMessage(msg);
    const pk = SigningKey.recoverPublicKey(getBytes(hashMessage(msg)), sig);
    setSigner(s);
    setAddr(a);
    setPubKey(pk);
    setStatus("Connected. Initializing 0G Compute…");
    const b = await initBroker(s);
    await ensureFunded(b);
    if (CONFIG.COMPUTE_PROVIDER) {
      try {
        await ackProvider(b, CONFIG.COMPUTE_PROVIDER);
      } catch (e) {
        console.warn(e);
      }
    }
    setBroker(b);
    setStatus("");
  }

  async function doMint() {
    if (!signer) return;
    setStatus("Minting your companion on 0G Chain…");
    const { tokenId, txHash } = await mintCompanion(signer, persona, ZeroHash);
    setTokenId(tokenId);
    setMintTx(txHash);
    setStatus("");
  }

  async function send() {
    if (!signer || !broker || !tokenId || !input.trim()) return;
    if (!CONFIG.COMPUTE_PROVIDER) {
      setStatus("Set VITE_COMPUTE_PROVIDER to a pinned 0G Compute provider.");
      return;
    }
    const userMsg: Msg = { role: "user", content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setStatus("Thinking inside a 0G TEE…");

    const sys = { role: "system", content: persona };
    const res = await chat(broker, CONFIG.COMPUTE_PROVIDER, [
      sys,
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ]);
    const aiMsg: Msg = { role: "assistant", content: res.content, tee: res.teeVerified };
    const updated = [...history, aiMsg];
    setMessages(updated);

    // Evolve memory: encrypt the full transcript -> 0G Storage -> update on-chain root.
    setStatus("Sealing this memory to 0G Storage…");
    try {
      const transcript = JSON.stringify(updated);
      const ciphertext = pubKey
        ? encryptForPubKey(pubKey, transcript)
        : new TextEncoder().encode(transcript);
      const { rootHash, txHash } = await uploadEncrypted(signer, ciphertext);
      const root32 = rootHash.startsWith("0x") ? rootHash : hexlify(getBytes("0x" + rootHash));
      const memTx = await updateMemoryRoot(signer, tokenId, root32);
      setMemory((m) => [...m, { root: root32, txHash: memTx || txHash, at: Date.now() }]);
    } catch (e: any) {
      console.warn("memory evolve:", e);
      setStatus("Memory upload skipped (configure 0G Storage). Chat still works.");
      setTimeout(() => setStatus(""), 2500);
      return;
    }
    setStatus("");
  }

  async function onTransfer(to: string) {
    if (!signer || !tokenId) return;
    setStatus("Transferring ownership on 0G Chain…");
    await transferCompanion(signer, to, tokenId);
    setStatus(`Transferred. The companion now belongs to ${to.slice(0, 8)}…. Its memory is sealed for the new owner.`);
    setTokenId(null);
    setMessages([]);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Aeon</h1>
          <p className="text-sm text-slate-400">Own your AI. Forever.</p>
        </div>
        {addr ? (
          <span className="chip">{addr.slice(0, 6)}…{addr.slice(-4)}</span>
        ) : (
          <button className="btn" onClick={connect}>Connect wallet</button>
        )}
      </header>

      <div className="mt-6 flex items-center justify-center">
        <div className="h-28 w-28 animate-breathe rounded-full bg-gradient-to-br from-aeon-glow to-aeon-glow2 blur-[2px]" />
      </div>

      {status && <p className="mt-3 text-center text-sm text-aeon-glow2">{status}</p>}

      {!tokenId ? (
        <section className="mt-6 card">
          <h2 className="text-lg font-semibold">Mint your companion</h2>
          <p className="mt-1 text-sm text-slate-400">It becomes an Intelligent NFT you own on 0G.</p>
          <textarea
            className="mt-3 w-full rounded-xl bg-black/40 p-3 text-sm ring-1 ring-white/10 outline-none"
            rows={2}
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
          />
          <button className="btn mt-3" disabled={!signer} onClick={doMint}>
            {signer ? "Mint companion" : "Connect wallet first"}
          </button>
          {mintTx && <p className="mt-2 text-xs text-slate-500">mint tx: {mintTx}</p>}
        </section>
      ) : (
        <section className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="chip">companion #{tokenId.toString()}</span>
            <button className="text-sm text-aeon-glow2" onClick={() => setTransferOpen(true)}>
              Give it away →
            </button>
          </div>

          <div className="card max-h-80 space-y-3 overflow-y-auto">
            {messages.length === 0 && <p className="text-sm text-slate-400">Say hello to your companion.</p>}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-aeon-glow/30" : "bg-white/5"
                  }`}
                >
                  {m.content}
                </div>
                {m.role === "assistant" && (
                  <div className="mt-1">
                    <TEEBadge verified={m.tee ?? null} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl bg-black/40 px-3 py-2 text-sm ring-1 ring-white/10 outline-none"
              placeholder="Tell your companion something…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="btn" onClick={send}>Send</button>
          </div>

          <MemoryTimeline points={memory} />
        </section>
      )}

      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} onTransfer={onTransfer} />

      <footer className="mt-10 text-center text-xs text-slate-600">
        Built on 0G · INFT (ERC-7857) + 0G Compute TEE + 0G Storage · #TheZeroCup
      </footer>
    </div>
  );
}
