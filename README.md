<div align="center">

# Aeon — Own your AI. Forever.

**An AI companion you truly own.** It remembers privately, evolves over time, and can be gifted,
sold, or passed on — because it lives on-chain as an Intelligent NFT (ERC-7857) on **0G**.

Built for the **0G Zero Cup**.

</div>

---

## Table of contents
- [Overview](#overview)
- [How it works: the four 0G pillars](#how-it-works-the-four-0g-pillars)
- [Project status](#project-status)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [End-to-end testing runbook](#end-to-end-testing-runbook)
- [Deploying to Vercel](#deploying-to-vercel)
- [Testing checklist](#testing-checklist)
- [Roadmap](#roadmap)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

Most personal AI today is **rented**. Users invest months of context and personality into a service, yet they
cannot export it, move it, resell it, or pass it on. Privacy is a stated policy rather than something a user
can verify. And when a provider changes terms or shuts down, the relationship and its history disappear.

Aeon takes a different approach:

- **Ownership.** A companion is minted as an Intelligent NFT on 0G Chain. The owner can hold it, transfer it,
  or pass it on.
- **Private inference.** Conversations run through the **0G Compute Router**, which executes inference inside a
  TEE enclave; the API key stays server-side and the provider cannot read the prompt.
- **Portable, evolving memory.** The companion's memory is encrypted on the client and stored on 0G Storage.
  Each conversation updates an on-chain pointer (`memoryRoot`), producing a verifiable record of how the
  memory grows over time.

---

## How it works: the four 0G pillars

| Pillar | Role in Aeon |
|--------|--------------|
| **0G Chain + INFT (ERC-7857)** | The companion is a token. Ownership, transfer, royalties (EIP-2981), and the `memoryRoot` pointer are recorded on-chain (client-signed via MetaMask). |
| **0G Compute (Router, TEE)** | Each chat turn is proxied by the app's server to the 0G Compute Router (OpenAI-compatible), which runs inference in a TEE enclave. |
| **0G Storage** | The companion's encrypted memory is uploaded by the app's server (the SDK is Node-only); each upload yields a content-addressed root hash referenced on-chain. |
| **Re-encryption oracle** | On transfer, re-encrypts the memory for the new owner — the mechanism described by ERC-7857. *(Planned; see status.)* |

> The client encrypts memory (ECIES, to the owner's key) **before** it is sent to the server, so the server
> only ever handles ciphertext.

---

## Project status

A working prototype with a clearly scoped roadmap.

| Area | Current implementation | Roadmap |
|------|------------------------|---------|
| INFT contract | `AeonINFT.sol` (ERC-721 + ERC-2981, `memoryRoot`, guarded `updateMemoryRoot`, `setOracle`) | Tests; audit |
| Mint / ownership | Mint + on-chain ownership via MetaMask | — |
| Chat | Server proxy to the 0G Compute Router (TEE); "Private · 0G TEE" badge | Streaming responses; model picker |
| Memory (write) | Client-side ECIES encryption → server upload to 0G Storage → on-chain `memoryRoot` update → timeline | Memory-summary RAG for long histories |
| Memory (read) | Server download endpoint (`/api/storage/download`) returns ciphertext for the owner to decrypt | Client restore/replay UI |
| Transfer | `transferFrom` changes ownership on-chain; new owner sees a verifiable "memory sealed" state | Live re-encryption (oracle) |
| Re-encryption oracle | Stub only (`oracle/reencrypt.ts`) | Worker that re-encrypts memory for the new owner on transfer |

**On transfer:** ownership moves on-chain immediately. The memory stays encrypted to the previous owner (a
verifiable "sealed" state) until the re-encryption oracle re-encrypts it for the new owner. The oracle is on
the roadmap; the current build does not move readable memory between owners.

---

## Architecture

```
   Browser (Vite/React) + MetaMask
     │  mint / transfer / memoryRoot (client-signed)
     ▼
  ┌────────────────┐       ┌──────────────────────────── Server API (Vercel / Express) ───────────────────────────┐
  │ 0G Chain (EVM) │       │  /api/chat            → 0G Compute Router (OpenAI-compatible, TEE)  [ROUTER_API_KEY]   │
  │ AeonINFT.sol   │◀──────│  /api/storage/upload  → 0G Storage (Node SDK, server signer)        [STORAGE_PRIVATE…] │
  │ memoryRoot     │       │  /api/storage/download← 0G Storage (by root hash)                                      │
  └──────┬─────────┘       └────────────────────────────────────────────────────────────────────────────────────┘
         │ Transfer event                         ▲
         ▼                                        │ encrypted bytes only (client encrypts first, ECIES)
  ┌──────────────────────────────────────────┐
  │ Re-encryption oracle (planned)            │
  └──────────────────────────────────────────┘
```

Full technical detail (data flows, contract spec, security model, trust boundaries): **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**.

---

## Repository layout

```
aeon/
├── contracts/                 # Solidity + Hardhat (deploy to 0G Galileo, chainId 16602)
│   ├── AeonINFT.sol
│   └── scripts/deploy.ts
├── app/                       # Vite + React frontend AND the Node API
│   ├── api/                   # Vercel serverless functions
│   │   ├── chat.ts            # → 0G Compute Router
│   │   ├── storage/upload.ts  # → 0G Storage (Node SDK)
│   │   ├── storage/download.ts
│   │   └── _lib/handlers.ts   # shared server logic (secrets live here)
│   ├── server/dev.ts          # local Express server (same handlers) for `npm run dev`
│   ├── src/
│   │   ├── lib/0g/            # chain.ts (wallet/mint/transfer) · compute.ts + storage.ts (call /api) · crypto.ts (ECIES)
│   │   ├── components/ · screens/
│   │   └── App.tsx · config.ts
│   └── vercel.json
├── oracle/reencrypt.ts        # re-encryption oracle (planned)
├── docs/                      # ARCHITECTURE.md · PITCH_DECK.md
└── README.md
```

---

## Tech stack

- **Frontend:** Vite, React, TypeScript, Tailwind, ethers v6 (browser bundle is ethers + eciesjs only).
- **Server API:** Node (Vercel functions in prod; Express for local dev) — proxies chat to the 0G Compute
  Router and runs the Node 0G Storage SDK (`@0gfoundation/0g-storage-ts-sdk`).
- **Cryptography:** `eciesjs` (ECIES to the owner's secp256k1 key), client-side.
- **Contracts:** Solidity, OpenZeppelin (ERC-721 + ERC-2981), Hardhat.
- **Network:** 0G Galileo testnet (chainId **16602**).

---

## Getting started

### Prerequisites
- Node.js 18+
- MetaMask, funded at [`faucet.0g.ai`](https://faucet.0g.ai) (0.1 0G/day)
- A second testnet wallet for **storage** (server signer), also funded at the faucet
- A 0G Compute Router API key (`app-sk-…`) from [`pc.testnet.0g.ai`](https://pc.testnet.0g.ai)

### 1) Deploy the contract
```bash
cd contracts
cp .env.example .env          # add PRIVATE_KEY (testnet)
npm install && npx hardhat compile
npx hardhat run scripts/deploy.ts --network zerogTestnet   # chainId 16602
# copy the printed AeonINFT address
```

### 2) Configure + run the app (frontend + API together)
```bash
cd ../app
cp .env.example .env          # fill client (VITE_*) + server vars (see below)
npm install
npm run dev                   # starts Vite (web) AND the Express API together
```
Open the printed localhost URL, connect MetaMask (it will prompt to add/switch to 0G Galileo), and mint.

---

## Configuration

`app/.env` has two halves — **client** (`VITE_*`, shipped to the browser) and **server** (secrets, never
shipped). See `app/.env.example`.

```
# client
VITE_ZG_RPC=https://evmrpc-testnet.0g.ai
VITE_ZG_CHAIN_ID=16602
VITE_EXPLORER=https://chainscan-galileo.0g.ai
VITE_AEON_CONTRACT=0x...            # from deploy output

# server (NEVER prefix with VITE_)
ROUTER_BASE=https://router-api-testnet.integratenetwork.work/v1
ROUTER_API_KEY=app-sk-...           # from pc.testnet.0g.ai
ROUTER_MODEL=llama-3.3-70b-instruct
ZG_RPC=https://evmrpc-testnet.0g.ai
INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
STORAGE_PRIVATE_KEY=0x...           # funded testnet wallet that pays for storage
```

---

## End-to-end testing runbook

1. **Fund** your MetaMask wallet **and** the `STORAGE_PRIVATE_KEY` wallet at `https://faucet.0g.ai`.
2. **Create** a Compute Router key at `https://pc.testnet.0g.ai` (connect → deposit → create key) →
   `ROUTER_API_KEY`.
3. **Deploy** the contract (step 1 above) → set `VITE_AEON_CONTRACT`.
4. **Configure** `app/.env` (client + server) and run `npm run dev`.
5. **Connect** the wallet (approve add/switch to 0G Galileo) → **Mint** (genesis memory uploads via
   `/api/storage`, then the mint tx) → **Chat** (replies come from the Compute Router with the "Private · 0G
   TEE" badge; each turn seals memory to 0G Storage and updates `memoryRoot`) → **Transfer** to a second
   address (`transferFrom`).
6. **Verify** every tx on `https://chainscan-galileo.0g.ai`.

> If `VITE_CHAIN_ID`/RPC ever change upstream, update the client + server env; the app reads them at runtime.

---

## Deploying to Vercel

Import the **`app/`** directory as the Vercel project (framework: Vite). The `api/` folder deploys as Node
serverless functions automatically. Set the **server** env vars (`ROUTER_*`, `ZG_RPC`, `INDEXER_RPC`,
`STORAGE_PRIVATE_KEY`) and the client `VITE_*` vars in the Vercel project settings. `vercel.json` configures
the function runtime and the SPA rewrite.

---

## Testing checklist

- Contract deploys; `mint` and `transferFrom` succeed; `updateMemoryRoot` rejects non-owner/non-oracle.
- `npm run dev` serves the app and the API; `GET /api/health` returns `{ ok: true }`.
- Chat returns a Compute Router reply with the "Private · 0G TEE" badge.
- Encrypt → `/api/storage/upload` returns a real `rootHash` → `updateMemoryRoot` tx → memory timeline updates.
- E2E: mint → chat → memory pointer updates → transfer → new owner sees the "sealed memory" state.

---

## Roadmap

- [ ] Re-encryption oracle so memory transfers (readable) with the companion.
- [ ] Client-side memory restore/replay from `/api/storage/download`.
- [ ] Streaming chat responses + model picker.
- [ ] Marketplace and royalties UI (EIP-2981 is already supported by the contract).
- [ ] Contract test suite + audit.

---

## Documentation

- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — technical reference (data flow, contract, security model).
- **[`docs/PITCH_DECK.md`](docs/PITCH_DECK.md)** — market analysis and opportunity.

---

## License

MIT (see source headers). Open-source libraries are used under their respective licenses.

<div align="center">

Built on **0G** · INFT (ERC-7857) + 0G Compute Router (TEE) + 0G Storage

</div>
