<div align="center">

# Aeon — Own your AI. Forever.

**The first AI companion you truly own.** It remembers privately, evolves forever, and can be
gifted, sold, or passed down — because it lives on‑chain as an Intelligent NFT (ERC‑7857) on **0G**.

Built for the **0G Zero Cup**.

</div>

---

## Table of contents
- [Why Aeon](#why-aeon)
- [How it works (the four 0G pillars)](#how-it-works-the-four-0g-pillars)
- [What's in the box](#whats-in-the-box)
- [Build status](#build-status)
- [Architecture (high level)](#architecture-high-level)
- [Repo layout](#repo-layout)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [How each 0G piece is wired](#how-each-0g-piece-is-wired)
- [Verify (definition of done)](#verify-definition-of-done)
- [Verify‑before‑deploy](#verify-before-deploy)
- [Roadmap](#roadmap)
- [Docs](#docs)

---

## Why Aeon

Every AI you use today is a **rental**. You pour months of context, personality, and emotional labor into it
and own *nothing* — no export, no portability, no resale, no inheritance. Privacy is a *promise* ("we don't
read your chats"), never a *proof*. And the day the company bans you, raises prices, or shuts down, your
companion is gone.

Aeon fixes all three:

- **You own it.** Your companion is an Intelligent NFT on 0G. You hold it, transfer it, or pass it on.
- **It's private — provably.** Every conversation runs in a 0G Compute TEE; the app shows a cryptographic
  attestation that the provider couldn't read it.
- **It's alive and portable.** Its memory is encrypted and stored on 0G, grows with every conversation, and
  travels with the companion when you give it away.

> Every AI you've ever used, you rented. Aeon is the one you own — and can hand to someone you love.

---

## How it works (the four 0G pillars)

Aeon uses **all four 0G pillars as load‑bearing structure** — remove any one and it collapses into a generic
chatbot (which is exactly why it qualifies under the Zero Cup "no bolt‑ons" rule).

| Pillar | Role in Aeon |
|--------|--------------|
| **0G Chain + INFT (ERC‑7857)** | The companion *is* the token. Ownership, transfer, royalties (EIP‑2981), and the `memoryRoot` pointer live on‑chain. |
| **0G Compute (TEE)** | Every chat turn runs in a TEE; `processResponse` verifies a signature proving the provider couldn't read it. *Provable* privacy. |
| **0G Storage** | The companion's memory is an encrypted, growing blob; each root hash is an on‑chain receipt of its life. |
| **Re‑encryption oracle** | On transfer, re‑encrypts the memory for the new owner — ERC‑7857's defining mechanism. |

---

## What's in the box

- A deployable **ERC‑7857‑style INFT contract** (`AeonINFT.sol`) with royalties and a guarded memory pointer.
- A **React dApp** that mints a companion, chats with it through 0G Compute (with a live TEE proof badge),
  encrypts each conversation and stores it on 0G Storage, anchors the root hash on‑chain, and transfers the
  companion to another wallet.
- A **re‑encryption oracle stub** (Cloudflare Worker) for the "memory travels with the companion" mechanism.
- Full **strategy, architecture, and pitch‑deck** docs.

---

## Build status

- **Group‑stage build (shippable today):** mint INFT → TEE‑verified chat (badge) → encrypted memory to 0G
  Storage with a **live on‑chain root‑hash timeline** → on‑chain transfer with a verifiable **"memory sealed"**
  state for the new owner. **Nothing is faked** — the re‑encryption step is clearly marked as roadmap.
- **Roadmap to July 8:** live re‑encryption oracle, Whisper voice input, z‑image avatar, marketplace +
  royalties UI, memory‑summary RAG.

---

## Architecture (high level)

```
   Browser (Vite/React) + MetaMask
     │ mint/transfer        │ chat                  │ encrypt + store
     ▼                      ▼                       ▼
  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐
  │ 0G Chain       │  │ 0G Compute (TEE)│  │ 0G Storage       │
  │ AeonINFT.sol   │  │ GLM‑5/DeepSeek  │  │ encrypted memory │
  │ memoryRoot     │  │ TEE signature   │  │ → root hash      │
  └──────┬─────────┘  └─────────────────┘  └──────────────────┘
         │ Transfer event
         ▼
  ┌──────────────────────────────────────────┐
  │ Re‑encryption oracle (Cloudflare Worker) │  ← July 8
  │ ECIES re‑encrypt memory → new owner       │
  └──────────────────────────────────────────┘
```

Full details (data flow, contract design, security model, trust boundaries): **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**.

---

## Repo layout

```
aeon/
├── contracts/                 # Solidity + Hardhat
│   ├── AeonINFT.sol           # ERC721 + ERC2981 + memoryRoot + oracle guard
│   ├── hardhat.config.ts
│   ├── scripts/deploy.ts
│   └── .env.example
├── app/                       # Vite + React + TS + Tailwind frontend
│   ├── src/
│   │   ├── lib/0g/            # the 0G integration
│   │   │   ├── chain.ts       # connect, mint, transfer, read/update memoryRoot
│   │   │   ├── compute.ts     # broker: ack → chat → processResponse (TEE)
│   │   │   ├── storage.ts     # 0G Storage upload + segment download
│   │   │   └── crypto.ts      # ECIES encrypt/decrypt
│   │   ├── components/        # TEEBadge · MemoryTimeline · TransferModal
│   │   ├── App.tsx            # orchestrates the full flow
│   │   └── config.ts          # RPCs, contract addr, provider addr, ABI
│   └── .env.example
├── oracle/
│   └── reencrypt.ts           # re‑encryption oracle (Cloudflare Worker) — July 8
├── docs/
│   ├── ARCHITECTURE.md        # full technical reference
│   └── PITCH_DECK.md          # 12‑slide presenter deck
└── README.md
```

---

## Quick start

### Prerequisites
- Node.js 18+
- MetaMask with **0G testnet gas tokens** (need ~3+ 0G to access 0G Compute)
- A deployer private key (testnet only)

### 1) Deploy the contract
```bash
cd contracts
cp .env.example .env          # add PRIVATE_KEY (testnet)
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network zerogTestnet
# → copy the printed AeonINFT address
```

### 2) Run the app
```bash
cd ../app
cp .env.example .env          # set VITE_AEON_CONTRACT + VITE_COMPUTE_PROVIDER
npm install
npm run dev                   # open the printed localhost URL
```

### 3) Pick a 0G Compute provider
With the broker initialized, run `broker.inference.listService()`, choose a tested **chatbot** provider, and
set its address as `VITE_COMPUTE_PROVIDER`. First use also runs a one‑time on‑chain
`acknowledgeProviderSigner` (handled automatically on connect).

---

## Configuration

`app/.env`:
```
VITE_ZG_RPC=https://evmrpc-testnet.0g.ai          # verify current testnet RPC
VITE_ZG_CHAIN_ID=16601                             # verify current testnet chainId
VITE_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
VITE_AEON_CONTRACT=0x...                            # from deploy output
VITE_COMPUTE_PROVIDER=0x...                         # pinned, tested provider
VITE_DEFAULT_MODEL=glm-5
```
`contracts/.env`: `PRIVATE_KEY`, `ZG_RPC`.

---

## How each 0G piece is wired

- **Mint** (`lib/0g/chain.ts`): `AeonINFT.mint(personaSeed, initialRoot)` → token + `memoryRoot`.
- **Chat** (`lib/0g/compute.ts`): `initBroker` → `ensureFunded` → `acknowledgeProviderSigner` →
  `getServiceMetadata`/`getRequestHeaders` → `POST {endpoint}/chat/completions` → `processResponse` (TEE check).
- **Memory** (`lib/0g/crypto.ts` + `lib/0g/storage.ts`): ECIES‑encrypt transcript → `Indexer.upload` → root
  hash → `AeonINFT.updateMemoryRoot(tokenId, newRoot)` → `MemoryTimeline` updates.
- **Transfer** (`lib/0g/chain.ts`): `AeonINFT.transferFrom(...)`; new owner sees the verifiable "sealed
  memory" state today; the oracle re‑encrypts on the July‑8 build.

---

## Verify (definition of done)

- Contract deploys; `mint` + `transferFrom` succeed; `updateMemoryRoot` **rejects** a non‑owner/non‑oracle.
- `acknowledgeProviderSigner` succeeds once; chat returns; `processResponse` returns a valid TEE signature.
- Encrypt → 0G Storage upload → root hash written on‑chain → memory timeline updates.
- E2E: mint → chat (badge) → root hash changes → transfer → new owner sees "sealed memory".

---

## Verify‑before‑deploy

- Confirm the current **0G testnet chainId / RPC / indexer** in the 0G docs.
- Confirm the broker package name/version: `@0glabs/0g-serving-broker` vs `0gfoundation/0g-serving-user-broker`,
  and check SDK method signatures against the installed version.
- Browser 0G Storage downloads use `downloadSegmentByTxSeq()` (not `indexer.download()`).

---

## Roadmap

- [ ] Live re‑encryption **oracle** (Cloudflare Worker) — memory travels with the companion on transfer.
- [ ] **Voice** input via Whisper.
- [ ] **Avatar** generation via z‑image‑turbo.
- [ ] **Marketplace + royalties** UI (EIP‑2981 already in the contract).
- [ ] **Memory‑summary RAG** for long‑horizon continuity.

---

## Docs

- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — full technical reference (data flow, contract, security).
- **[`docs/PITCH_DECK.md`](docs/PITCH_DECK.md)** — 12‑slide presenter deck with script.

---

<div align="center">

Built on **0G** · INFT (ERC‑7857) + 0G Compute TEE + 0G Storage · `#TheZeroCup`

</div>
