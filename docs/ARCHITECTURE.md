# Aeon — Architecture

A technical reference for Aeon: system design, components, data flows, the smart-contract specification, the
AI/inference layer, the storage and encryption model, the security model, and the trust boundaries. It also
states clearly what is implemented today and what is planned.

---

## 1. Overview

Aeon is an AI companion represented as an on-chain asset. A companion is minted as an **ERC-7857 Intelligent
NFT (INFT)** on **0G Chain** (client-signed via MetaMask). Conversations are processed by the **0G Compute
Router** through the application's server, which runs inference inside a TEE enclave. The companion's
**memory is encrypted on the client and stored on 0G Storage** (via the server, because the Storage SDK is
Node-only), and an on-chain pointer (`memoryRoot`) is updated as the memory grows, producing a verifiable
history.

Each 0G component performs non-substitutable work: ownership and transfer (Chain/INFT), private inference
(Compute Router/TEE), and portable encrypted memory with an on-chain pointer (Storage).

---

## 2. Design goals

- **Ownership** of a personal AI as a first-class, transferable asset.
- **Private inference** via a TEE, with the API key held server-side (never in the browser).
- **Portable, evolving memory** encrypted client-side and anchored on-chain.
- **Non-custodial memory**: the client encrypts to the owner's key before upload, so the server only ever
  handles ciphertext.
- **Clear trust boundaries** between the client, the application server, the Compute Router, and the (planned)
  re-encryption oracle.

---

## 3. System architecture

```
                          ┌──────────────────────────────────────────────┐
   Browser (Vite/React)   │  Aeon dApp                                    │
   + MetaMask  ───────────┤  Mint · Chat · Memory Timeline · Transfer UI  │
                          │  ethers v6 signer · ECIES (client-side)       │
                          └───┬───────────────────────────┬──────────────┘
       (1) mint / transfer /  │                            │  (2) /api/chat, /api/storage/*
           memoryRoot (signed)│                            │  (ciphertext only)
                              ▼                            ▼
                  ┌────────────────┐        ┌──────────── Server API (Vercel / Express) ─────────────┐
                  │ 0G Chain (EVM) │        │  /api/chat           → 0G Compute Router (TEE)          │
                  │ AeonINFT.sol   │        │  /api/storage/upload → 0G Storage (Node SDK, signer)    │
                  │ (ERC-7857)     │        │  /api/storage/download ← 0G Storage (by root hash)      │
                  │ memoryRoot slot│        │  secrets: ROUTER_API_KEY, STORAGE_PRIVATE_KEY           │
                  └──────┬─────────┘        └─────────────────────────────────────────────────────────┘
                         │ Transfer(from,to,tokenId) event
                         ▼
                  ┌────────────────────────────────────────────┐
                  │ Re-encryption Oracle                        │  (Planned)
                  │ re-encrypt memory (old→new owner)           │
                  │ → re-upload → updateMemoryRoot(tokenId,root)│
                  └────────────────────────────────────────────┘
```

**Trust boundaries**
- **Client (browser):** holds the user's wallet; signs all chain transactions (mint, transfer,
  `updateMemoryRoot`); encrypts memory with ECIES before sending it to the server. Holds no server secret.
- **Application server (Vercel functions / Express):** holds the Compute Router API key and the storage
  signer key. Proxies chat to the Router and performs storage uploads/downloads. Receives only ciphertext for
  memory, so it cannot read companion contents.
- **0G Compute Router:** runs inference inside a TEE enclave; the inference provider cannot read the prompt.
- **Re-encryption oracle (planned):** the only component permitted to re-encrypt memory on transfer; its key
  is held server-side. The contract restricts `updateMemoryRoot` to the owner or the oracle address.

---

## 4. Component map

| Path | Responsibility | Status |
|------|----------------|--------|
| `contracts/AeonINFT.sol` | ERC-721 + ERC-2981 INFT; `personaSeed`, `memoryRoot`, guarded `updateMemoryRoot`, `setOracle`. | Implemented |
| `app/api/_lib/handlers.ts` | Shared server logic: `chatComplete` (Router), `storageUpload`/`storageDownload` (0G Storage). Reads server secrets. | Implemented |
| `app/api/chat.ts`, `app/api/storage/*.ts` | Vercel serverless adapters over the handlers. | Implemented |
| `app/server/dev.ts` | Local Express server using the same handlers (for `npm run dev`). | Implemented |
| `app/src/lib/0g/chain.ts` | Wallet connect, network add/switch, mint/transfer/`updateMemoryRoot` (ethers v6). | Implemented |
| `app/src/lib/0g/compute.ts` | Client wrapper calling `/api/chat`. | Implemented |
| `app/src/lib/0g/storage.ts` | Client wrapper calling `/api/storage/*` (base64 ciphertext). | Implemented |
| `app/src/lib/0g/crypto.ts` | ECIES encrypt to owner pubkey / decrypt with owner privkey. | Implemented |
| `app/src/components/*`, `screens/*`, `App.tsx` | UI + orchestration. | Implemented |
| `oracle/reencrypt.ts` | Re-encryption oracle. | Stub (planned) |

---

## 5. Data flows

### 5.1 Mint
1. The user connects MetaMask (`chain.ts:getSigner`), which also adds/switches to 0G Galileo
   (`ensureNetwork`). The app recovers the user's **secp256k1 public key** from a signed message for ECIES.
2. The genesis memory is ECIES-encrypted and uploaded via `/api/storage/upload`, returning a root hash.
3. `AeonINFT.mint(personaSeed, initialRoot)` is sent from the wallet; the contract stores `personaSeed` and
   `memoryRoot` and emits `CompanionMinted`.

### 5.2 Chat (private)
1. The client POSTs the system prompt + history to `/api/chat`.
2. The server proxies to the 0G Compute Router (`${ROUTER_BASE}/chat/completions`, `Authorization: Bearer
   app-sk-…`); inference runs in a TEE enclave.
3. The reply returns to the client; the UI shows the **"Private · 0G TEE"** badge.

### 5.3 Memory evolution
1. After each turn, the transcript is **ECIES-encrypted on the client** (`crypto.ts:encryptForPubKey`).
2. The ciphertext is sent to `/api/storage/upload`; the server uploads it to 0G Storage (Node SDK, server
   signer) and returns the **root hash** (a bytes32).
3. The client sends `AeonINFT.updateMemoryRoot(tokenId, newRoot)` from the wallet; the contract emits
   `MemoryEvolved`. The memory timeline appends the new root.

### 5.4 Transfer
1. The owner sends `AeonINFT.transferFrom(owner, recipient, tokenId)`; ERC-721 emits `Transfer`.
2. **Current behavior:** ownership changes on-chain immediately. The new owner sees a verifiable **"memory
   sealed"** state — the `memoryRoot` exists on-chain, but the blob remains encrypted to the previous owner.
3. **Planned behavior:** the re-encryption oracle observes `Transfer`, re-encrypts the memory for the new
   owner, re-uploads, and calls `updateMemoryRoot` as the authorized `oracle`. See §9.

---

## 6. Smart-contract specification (`AeonINFT.sol`)

- **Base:** OpenZeppelin `ERC721` + `ERC2981` (royalties) + `Ownable`.
- **State:** `memoryRoot[tokenId]` (0G Storage pointer), `personaSeed[tokenId]`, `oracle` (trusted address).
- **Functions:** `mint(seed, initialRoot)`, `updateMemoryRoot(tokenId, newRoot)` (guarded:
  `msg.sender == ownerOf(tokenId) || msg.sender == oracle`), `getMemoryRoot`, `setOracle` (owner-only),
  `transferFrom` (ERC-721).
- **Events:** `CompanionMinted`, `MemoryEvolved`, `OracleUpdated`, `Transfer`.
- **Security-critical invariant:** `updateMemoryRoot` must not be callable by arbitrary addresses.

---

## 7. AI / inference layer

- **Provider:** the **0G Compute Router** (OpenAI-compatible), reached server-side via `/api/chat`. Testnet
  base `https://router-api-testnet.integratenetwork.work/v1`; an `app-sk` key is created at `pc.testnet.0g.ai`.
- **Privacy:** the Router runs inference inside a TEE enclave, so the provider cannot read the prompt. The UI
  reflects this as **"Private · 0G TEE."** The Router does not expose a client-checkable per-response
  signature, so the app does not claim one (an earlier broker-based design did, via `processResponse`).
- **Context strategy:** the system prompt is derived from `personaSeed`/essence; recent turns are sent
  verbatim. A memory-summary step for long histories is planned.

---

## 8. Storage and encryption model

- **Substrate:** 0G Storage — content-addressed, decentralized object storage.
- **Server-side SDK:** the 0G Storage TypeScript SDK is Node-only (filesystem/streams), so uploads/downloads
  run on the server (`/api/storage/*`) with a dedicated, funded signer (`STORAGE_PRIVATE_KEY`).
- **Encryption:** memory is ECIES-encrypted **on the client** to the owner's secp256k1 public key before being
  sent to the server. Only the owner's private key can decrypt; the server handles ciphertext only.
- **Pointer:** the upload's **root hash** (bytes32) is written on-chain as `memoryRoot`, letting the contract
  identify the current memory blob for a token.

---

## 9. Re-encryption oracle (planned)

Implements the ERC-7857 mechanism for moving memory to a new owner on transfer: observe `Transfer`, read the
blob from 0G Storage, decrypt with the previous owner's key inside a trusted environment, re-encrypt to the new
owner's key, re-upload, and call `updateMemoryRoot` as the authorized `oracle`. The oracle key is held
server-side; the contract's owner-or-oracle guard enforces who may update the pointer. Current implementation
(`oracle/reencrypt.ts`) is a stub.

---

## 10. Security model

| Concern | Mitigation |
|---------|-----------|
| Inference provider reading conversations | 0G Compute Router runs inference in a TEE enclave. |
| Compute Router API key exposure | Key held server-side (`ROUTER_API_KEY`); the browser calls `/api/chat`, never the Router directly. |
| Memory readable by the app server or storage nodes | Client-side ECIES encryption to the owner's key before upload. |
| Storage signer key exposure | `STORAGE_PRIVATE_KEY` held server-side only; pays storage fees; cannot read memory. |
| Unauthorized rewrite of a memory pointer | `updateMemoryRoot` restricted to the owner or oracle. |
| Loss of memory on transfer | Re-encryption oracle (planned); until then the new owner sees a verifiable "sealed" state, not silent loss. |

---

## 11. Why 0G is required

| Component removed | Resulting limitation |
|-------------------|----------------------|
| INFT / 0G Chain | The companion can no longer be owned or transferred as an asset. |
| 0G Compute (Router/TEE) | Inference is no longer private by hardware isolation. |
| 0G Storage | Memory is no longer portable, verifiable, or anchored on-chain. |
| Re-encryption oracle | Memory cannot be securely handed to a new owner on transfer. |

---

## 12. Configuration and runtime

**Network (0G Galileo testnet):** chainId **16602**, RPC `https://evmrpc-testnet.0g.ai`, explorer
`https://chainscan-galileo.0g.ai`, faucet `https://faucet.0g.ai`, storage indexer
`https://indexer-storage-testnet-turbo.0g.ai`.

**Client env (`VITE_*`):** `VITE_ZG_RPC`, `VITE_ZG_CHAIN_ID=16602`, `VITE_EXPLORER`, `VITE_AEON_CONTRACT`.

**Server env (secrets):** `ROUTER_BASE`, `ROUTER_API_KEY`, `ROUTER_MODEL`, `ZG_RPC`, `INDEXER_RPC`,
`STORAGE_PRIVATE_KEY`.

**Local dev:** `npm run dev` runs Vite (web) + the Express API together; Vite proxies `/api` to the API.
**Production:** Vercel — `app/` as the project, `app/api/*` as Node serverless functions, env vars set in the
project settings.

---

## 13. Current status and roadmap

**Implemented:** `AeonINFT` contract; mint + on-chain ownership; chat via the 0G Compute Router (server proxy,
TEE); client-side ECIES encryption; 0G Storage upload/download via the server API with on-chain `memoryRoot`
updates; memory timeline; on-chain transfer with a verifiable sealed-memory state; local + Vercel deployment.

**Planned:** the re-encryption oracle; client-side memory restore/replay; streaming chat + model picker;
marketplace and royalties UI; a contract test suite and audit.
