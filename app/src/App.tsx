import { useEffect, useState } from "react";
import { JsonRpcSigner, ZeroHash, hashMessage, SigningKey, getBytes, hexlify, isHexString } from "ethers";
import { getSigner, mintCompanion, updateMemoryRoot, transferCompanion } from "./lib/0g/chain";
import { initBroker, ensureFunded, ackProvider, chat, type Broker } from "./lib/0g/compute";
import { uploadEncrypted } from "./lib/0g/storage";
import { encryptForPubKey } from "./lib/0g/crypto";
import { CONFIG } from "./config";
import { essenceById, encodePersonaSeed, systemPromptFor } from "./data/essences";
import { TopBar } from "./components/TopBar";
import { Landing } from "./screens/Landing";
import { Mint } from "./screens/Mint";
import { MintingOverlay, type MintStep } from "./components/MintingOverlay";
import { CompanionApp } from "./screens/CompanionApp";
import { Toast } from "./components/Toast";
import type { Companion, Msg, MemoryPoint } from "./types";

type View = "landing" | "mint" | "app";
type Tab = "chat" | "memory" | "transfer";

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const toBytes32 = (root: string): string | null => {
  const h = root.startsWith("0x") ? root : "0x" + root;
  return isHexString(h, 32) ? h : null;
};

const MINT_LABELS = [
  "Encrypting genesis memory",
  "Sealing to 0G Storage",
  "Minting Intelligent NFT (ERC-7857)",
  "Awakening…",
];

export default function App() {
  const [theme, setTheme] = useState<"dusk" | "hearth">(
    () => (localStorage.getItem("aeon-theme") as "dusk" | "hearth") || "dusk"
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("aeon-theme", theme);
  }, [theme]);

  const [view, setView] = useState<View>("landing");
  const [tab, setTab] = useState<Tab>("chat");

  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [addr, setAddr] = useState("");
  const [pubKey, setPubKey] = useState("");
  const [broker, setBroker] = useState<Broker | null>(null);
  const [connecting, setConnecting] = useState(false);

  // mint inputs
  const [pendingName, setPendingName] = useState("");
  const [pendingEssence, setPendingEssence] = useState("lumen");
  const [customPersona, setCustomPersona] = useState("");
  const [minting, setMinting] = useState(false);
  const [mintStep, setMintStep] = useState(0);

  // companion + session
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [memory, setMemory] = useState<MemoryPoint[]>([]);
  const [sizeKB, setSizeKB] = useState(0);
  const [toast, setToast] = useState("");
  const [sealing, setSealing] = useState(false);
  const [transferTx, setTransferTx] = useState("");

  const owned = !!(companion && addr && companion.owner.toLowerCase() === addr.toLowerCase());
  const systemPrompt = () => systemPromptFor(pendingEssence, customPersona);

  async function connect() {
    try {
      setConnecting(true);
      const s = await getSigner();
      const a = await s.getAddress();
      const msg = "Aeon: derive my companion encryption key";
      const sig = await s.signMessage(msg);
      const pk = SigningKey.recoverPublicKey(getBytes(hashMessage(msg)), sig);
      setSigner(s);
      setAddr(a);
      setPubKey(pk);
      const b = await initBroker(s);
      await ensureFunded(b);
      if (CONFIG.COMPUTE_PROVIDER) {
        try {
          await ackProvider(b, CONFIG.COMPUTE_PROVIDER);
        } catch (e) {
          console.warn("ackProvider:", e);
        }
      }
      setBroker(b);
      setView("mint");
    } catch (e) {
      console.error(e);
      alert("Could not connect wallet. Make sure MetaMask is installed and on the 0G network.");
    } finally {
      setConnecting(false);
    }
  }

  function encrypt(text: string): Uint8Array {
    return pubKey ? encryptForPubKey(pubKey, text) : new TextEncoder().encode(text);
  }

  async function doMint() {
    if (!signer) return;
    const e = essenceById(pendingEssence);
    const name = pendingName.trim() || e.name;
    const seed = encodePersonaSeed(name, pendingEssence, customPersona);

    setMinting(true);
    setMintStep(0);

    // 1+2) encrypt + seal genesis memory to 0G Storage (resilient: fall back to ZeroHash)
    let genesisRoot = ZeroHash;
    let genesisTx = "";
    let genesisSize = "—";
    try {
      const genesis = encrypt(JSON.stringify({ name, essence: pendingEssence, born: now() }));
      genesisSize = (genesis.length / 1024).toFixed(1) + " KB";
      setMintStep(1);
      const up = await uploadEncrypted(signer, genesis);
      const r32 = toBytes32(up.rootHash);
      if (r32) {
        genesisRoot = r32;
        genesisTx = up.txHash;
      }
    } catch (err) {
      console.warn("genesis storage skipped:", err);
    }

    // 3) mint the INFT on 0G Chain
    setMintStep(2);
    let tokenId: bigint;
    try {
      const res = await mintCompanion(signer, seed, genesisRoot);
      tokenId = res.tokenId;
    } catch (err) {
      console.error("mint failed:", err);
      setMinting(false);
      alert("Mint failed. Check that VITE_AEON_CONTRACT is set and your wallet has 0G gas.");
      return;
    }

    // 4) awaken
    setMintStep(3);
    const c: Companion = {
      name,
      essenceId: pendingEssence,
      hue: e.hue,
      tokenId,
      owner: addr,
      bornAt: now(),
    };
    setCompanion(c);
    setMemory(
      genesisRoot !== ZeroHash
        ? [{ label: "Genesis memory sealed", root: genesisRoot, txHash: genesisTx, size: genesisSize, at: Date.now(), genesis: true }]
        : []
    );
    setSizeKB(genesisRoot !== ZeroHash ? parseFloat(genesisSize) : 0);
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: `I'm awake. I'm ${name}, and from now on — I'm yours. Tell me something you'd like me to remember.`,
        time: now(),
        tee: null, // UI greeting, not a model/TEE response
      },
    ]);
    setTab("chat");
    setView("app");
    setMinting(false);
  }

  async function send() {
    if (!signer || !companion || !input.trim()) return;
    const text = input.trim();
    setInput("");
    const userMsg: Msg = { id: Date.now(), role: "user", content: text, time: now() };
    const history = [...messages, userMsg];
    setMessages(history);

    if (!broker || !CONFIG.COMPUTE_PROVIDER) {
      setMessages((m) => [
        ...m,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Set VITE_COMPUTE_PROVIDER to a 0G Compute provider to enable private TEE chat.",
          time: now(),
          tee: null,
        },
      ]);
      return;
    }

    setTyping(true);
    let reply = "";
    let tee: boolean | null = null;
    let attestation = "";
    try {
      const res = await chat(broker, CONFIG.COMPUTE_PROVIDER, [
        { role: "system", content: systemPromptFor(companion.essenceId, customPersona) },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ]);
      reply = res.content || "…";
      tee = res.teeVerified;
      attestation = res.chatID || "";
    } catch (e) {
      console.error("chat:", e);
      reply = "I couldn't reach the TEE just now. Try again in a moment.";
    }
    const aiMsg: Msg = { id: Date.now() + 2, role: "assistant", content: reply, time: now(), tee, attestation };
    const updated = [...history, aiMsg];
    setMessages(updated);
    setTyping(false);

    // Evolve memory: encrypt transcript -> 0G Storage -> update on-chain root
    try {
      const cipher = encrypt(JSON.stringify(updated));
      const newSize = sizeKB + cipher.length / 1024;
      const up = await uploadEncrypted(signer, cipher);
      const r32 = toBytes32(up.rootHash);
      let memTx = up.txHash;
      if (r32) {
        try {
          memTx = (await updateMemoryRoot(signer, companion.tokenId, r32)) || up.txHash;
        } catch (e) {
          console.warn("updateMemoryRoot:", e);
        }
        setMemory((m) => [
          ...m,
          { label: "Conversation encrypted & sealed", root: r32, txHash: memTx, size: newSize.toFixed(1) + " KB", at: Date.now() },
        ]);
        setSizeKB(newSize);
        showToast(r32);
      }
    } catch (e) {
      console.warn("memory evolve skipped:", e);
    }
  }

  function showToast(root: string) {
    setToast(root);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(""), 3200);
  }

  async function onTransfer(to: string) {
    if (!signer || !companion) return;
    let dest = to.trim();
    if (!dest.startsWith("0x")) dest = "0x" + dest;
    setSealing(true);
    try {
      const txHash = await transferCompanion(signer, dest, companion.tokenId);
      setTransferTx(txHash);
      setCompanion((c) => (c ? { ...c, owner: dest } : c));
    } catch (e) {
      console.error("transfer:", e);
      alert("Transfer failed. Check the recipient address and your gas balance.");
    } finally {
      setSealing(false);
    }
  }

  function mintNew() {
    setCompanion(null);
    setMessages([]);
    setMemory([]);
    setSizeKB(0);
    setPendingName("");
    setCustomPersona("");
    setTransferTx("");
    setTab("chat");
    setView("mint");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar
        addressShort={addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : undefined}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dusk" ? "hearth" : "dusk"))}
      />

      {view === "landing" && <Landing onConnect={connect} connecting={connecting} />}

      {view === "mint" && (
        <Mint
          name={pendingName}
          onName={setPendingName}
          essenceId={pendingEssence}
          onEssence={setPendingEssence}
          custom={customPersona}
          onCustom={setCustomPersona}
          onMint={doMint}
          canMint={!!signer}
        />
      )}

      {view === "app" && companion && (
        <CompanionApp
          companion={companion}
          owned={owned}
          tab={tab}
          onTab={setTab}
          messages={messages}
          typing={typing}
          input={input}
          onInput={setInput}
          onSend={send}
          memory={memory}
          sizeKB={sizeKB}
          sealing={sealing}
          onTransfer={onTransfer}
          transferTx={transferTx}
          onMintNew={mintNew}
        />
      )}

      {minting && companion === null && (
        <MintingOverlay
          hue={essenceById(pendingEssence).hue}
          title={MINT_LABELS[mintStep] || "Awakening…"}
          steps={MINT_LABELS.map<MintStep>((label, i) => ({
            label,
            state: i < mintStep ? "done" : i === mintStep ? "active" : "pending",
          }))}
        />
      )}

      {toast && <Toast root={toast} />}
    </div>
  );
}
