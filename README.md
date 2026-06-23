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
- [How each 0G component is used](#how-each-0g-component-is-used)
- [Testing checklist](#testing-checklist)
- [Implementation notes](#implementation-notes)
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
- **Verifiable privacy.** Conversations run inside a 0G Compute Trusted Execution Environment (TEE). The
  application verifies the TEE signature for each response and surfaces the result in the UI, so privacy is
  demonstrable rather than merely promised.
- **Portable, evolving memory.** The companion's memory is encrypted on the client and stored on 0G Storage.
  Each conversation updates an on-chain pointer (`memoryRoot`), producing a verifiable record of how the
  memory grows over time.

---

## How it works: the four 0G pillars

Aeon is designed so that each 0G component performs work that is not easily substitutable. Removing any one of
them would materially reduce the product to a conventional chatbot.

| Pillar | Role in Aeon |
|--------|--------------|
| **0G Chain + INFT (ERC-7857)** | The companion is represented as a token. Ownership, transfer, royalties (EIP-2981), and the `memoryRoot` pointer are recorded on-chain. |
| **0G Compute (TEE)** | Each chat turn runs in a TEE; `processResponse` verifies a signature indicating the response came from a genuine enclave. |
| **0G Storage** | The companion's encrypted memory is stored off-chain; each upload yields a content-addressed root hash referenced on-chain. |
| **Re-encryption oracle** | On transfer, re-encrypts the memory for the new owner — the mechanism described by ERC-7857. *(Planned; see status below.)* |

---

## Project status

This repository is a working prototype with a clearly scoped roadmap. The table below states what is
implemented today versus what is planned.

| Area | Current implementation | Roadmap |
|------|------------------------|---------|
| INFT contract | `AeonINFT.sol` (ERC-721 + ERC-2981, `memoryRoot`, guarded `updateMemoryRoot`, `setOracle`) | Formal tests; audit pass |
| Mint / ownership | Mint and on-chain ownership via the dApp | — |
| Chat | 0G Compute broker chat with per-response TEE verification badge | Streaming responses; model selection |
| Memory (write) | Client-side ECIES encryption → 0G Storage upload → on-chain `memoryRoot` update → memory timeline | Memory-summary RAG for long histories |
| Memory (read) | Upload and on-chain pointer are wired; browser **download/decrypt** is not yet implemented (`storage.ts:downloadEncrypted` is a stub) | Segment-based browser download + decrypt |
| Transfer | `transferFrom` changes ownership on-chain; the new owner sees a verifiable "memory sealed" state | Live re-encryption (see oracle) |
| Re-encryption oracle | Stub only (`oracle/reencrypt.ts`) | Cloudflare Worker that re-encrypts memory for the new owner on transfer |
| Modalities | Text | Voice input (Whisper); avatar generation |
| Marketplace | — | Listing, royalties UI |

**On transfer behavior:** transferring a companion changes ownership on-chain immediately. The memory remains
encrypted to the previous owner (a verifiable "sealed" state) until the re-encryption oracle re-encrypts it for
the new owner. The oracle is on the roadmap; the current build does not move readable memory between owners.

---

## Architecture

```
   Browser (Vite/React) + MetaMask
     │ mint/transfer        │ chat                  │ encrypt + store
     ▼                      ▼                       ▼
  ┌────────────────┐  ┌─────────────────┐  ┌──────────────────┐
  │ 0G Chain       │  │ 0G Compute (TEE)│  │ 0G Storage       │
  │ AeonINFT.sol   │  │ GLM-5/DeepSeek  │  │ encrypted memory │
  │ memoryRoot     │  │ TEE signature   │  │ → root hash      │
  └──────┬─────────┘  └─────────────────┘  └──────────────────┘
         │ Transfer event
         ▼
  ┌──────────────────────────────────────────┐
  │ Re-encryption oracle (Cloudflare Worker)  │  (Planned)
  │ ECIES re-encrypt memory → new owner       │
  └──────────────────────────────────────────┘
```

Full technical detail (data flows, contract specification, security model, trust boundaries) is in
**[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)**.

---

## Repository layout

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
│   │   │   ├── storage.ts     # 0G Storage upload (download is a stub)
│   │   │   └── crypto.ts      # ECIES encrypt/decrypt
│   │   ├── components/        # TEEBadge · MemoryTimeline · TransferModal
│   │   ├── App.tsx            # orchestrates the full flow
│   │   └── config.ts          # RPCs, contract addr, provider addr, ABI
│   └── .env.example
├── oracle/
│   └── reencrypt.ts           # re-encryption oracle (Cloudflare Worker) — planned
├── docs/
│   ├── ARCHITECTURE.md        # technical reference
│   └── PITCH_DECK.md          # market analysis & opportunity
└── README.md
```

---

## Tech stack

- **Frontend:** Vite, React, TypeScript, TailwindCSS, ethers v6 (`BrowserProvider`).
- **0G SDKs:** `@0glabs/0g-serving-broker` (0G Compute), `@0gfoundation/0g-storage-ts-sdk` (0G Storage).
- **Cryptography:** `eciesjs` (ECIES to the owner's secp256k1 key).
- **Contracts:** Solidity, OpenZeppelin (ERC-721 + ERC-2981), Hardhat.
- **Network:** 0G Chain (EVM-compatible).
- **Planned:** Cloudflare Worker for the re-encryption oracle.

---

## Getting started

### Prerequisites
- Node.js 18+
- MetaMask with 0G testnet gas tokens (a small balance is required to access 0G Compute)
- A deployer private key (testnet only)

### 1) Deploy the contract
```bash
cd contracts
cp .env.example .env          # add PRIVATE_KEY (testnet)
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network zerogTestnet
# copy the printed AeonINFT address
```

### 2) Run the app
```bash
cd ../app
cp .env.example .env          # set VITE_AEON_CONTRACT and VITE_COMPUTE_PROVIDER
npm install
npm run dev                   # open the printed localhost URL
```

### 3) Select a 0G Compute provider
With the broker initialized, call `broker.inference.listService()`, choose a chatbot-type provider, and set its
address as `VITE_COMPUTE_PROVIDER`. The first use also performs a one-time on-chain
`acknowledgeProviderSigner` (handled on connect).

---

## Configuration

`app/.env`:
```
VITE_ZG_RPC=https://evmrpc-testnet.0g.ai          # confirm current testnet RPC
VITE_ZG_CHAIN_ID=16601                             # confirm current testnet chainId
VITE_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
VITE_AEON_CONTRACT=0x...                            # from deploy output
VITE_COMPUTE_PROVIDER=0x...                         # selected provider
VITE_DEFAULT_MODEL=glm-5
```
`contracts/.env`: `PRIVATE_KEY`, `ZG_RPC`.

---

## How each 0G component is used

- **Mint** (`lib/0g/chain.ts`): `AeonINFT.mint(personaSeed, initialRoot)` creates the token and stores its
  initial `memoryRoot`.
- **Chat** (`lib/0g/compute.ts`): `initBroker` → `ensureFunded` → `acknowledgeProviderSigner` →
  `getServiceMetadata` / `getRequestHeaders` → `POST {endpoint}/chat/completions` → `processResponse`
  (TEE verification), surfaced via the badge.
- **Memory** (`lib/0g/crypto.ts` + `lib/0g/storage.ts`): the transcript is ECIES-encrypted to the owner's
  public key, uploaded to 0G Storage, and the resulting root hash is written on-chain via
  `AeonINFT.updateMemoryRoot`.
- **Transfer** (`lib/0g/chain.ts`): `AeonINFT.transferFrom(...)`; the new owner sees the verifiable "sealed
  memory" state until the planned oracle re-encrypts it.

---

## Testing checklist

- Contract deploys; `mint` and `transferFrom` succeed; `updateMemoryRoot` rejects callers that are neither the
  owner nor the oracle.
- `acknowledgeProviderSigner` succeeds once; chat returns a response; `processResponse` returns a valid TEE
  signature and the badge reflects it.
- Encrypt → 0G Storage upload → `memoryRoot` written on-chain → the memory timeline updates.
- End-to-end: mint → chat → memory pointer updates → transfer → new owner sees the "sealed memory" state.

---

## Implementation notes

- Confirm the current 0G testnet **chainId, RPC, and indexer endpoints** against the 0G documentation.
- Confirm the broker package name/version (`@0glabs/0g-serving-broker` vs `0gfoundation/0g-serving-user-broker`)
  and verify SDK method signatures against the installed version.
- Browser reads from 0G Storage require segment-based download (`downloadSegmentByTxSeq()`); the standard
  `indexer.download()` is not suitable in the browser. The current `storage.ts:downloadEncrypted` is a stub.

---

## Roadmap

- [ ] Re-encryption oracle (Cloudflare Worker) so memory transfers with the companion.
- [ ] Browser-side memory download and decryption.
- [ ] Voice input (Whisper) and avatar generation.
- [ ] Marketplace and royalties UI (EIP-2981 is already supported by the contract).
- [ ] Memory-summary RAG for long-horizon continuity.
- [ ] Contract test suite and audit.

---

## Documentation

- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — technical reference (data flow, contract, security model).
- **[`docs/PITCH_DECK.md`](docs/PITCH_DECK.md)** — market analysis and opportunity.

---

## License

MIT (see source headers). Open-source libraries are used under their respective licenses.

<div align="center">

Built on **0G** · INFT (ERC-7857) + 0G Compute TEE + 0G Storage

</div>
