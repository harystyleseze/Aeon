# Aeon — Architecture

This document is the complete technical reference for Aeon: what each component does, how data flows,
the contract design, the AI/inference layer, the storage and encryption model, the security model, and the
trust boundaries. It is written to be read top‑to‑bottom by an engineer or a judge.

---

## 1. What Aeon is (in one paragraph)

Aeon is an AI companion that is a **truly‑owned, private, evolving on‑chain asset**. The companion is minted
as an **ERC‑7857 Intelligent NFT (INFT)** on **0G Chain**. Its conversations run inside a **0G Compute TEE**
(Trusted Execution Environment), so the inference provider cannot read them — and the app shows a
cryptographic attestation proving it. The companion's **memory is encrypted client‑side and stored on 0G
Storage**; every conversation appends to it and updates an on‑chain pointer (`memoryRoot`), so the memory
*provably grows*. Because the companion is a real token, you can **gift, sell, or inherit** it — and an
oracle re‑encrypts the memory for the new owner so the "soul" travels with it.

Remove any one of the four 0G pillars and Aeon degrades into a generic chatbot. That is the design intent.

---

## 2. System architecture

```
                          ┌──────────────────────────────────────────────┐
   Browser (Vite/React)   │  Aeon dApp  (deployed to Vercel)              │
   + MetaMask  ───────────┤  Mint · Chat · Memory Timeline · Transfer UI  │
                          │  ethers v6 BrowserProvider signer             │
                          └───┬───────────────┬───────────────┬──────────┘
            (1) mint/transfer │   (2) chat     │  (3) encrypt + store
                              ▼               ▼               ▼
                  ┌────────────────┐ ┌─────────────────┐ ┌─────────────────┐
                  │ 0G Chain (EVM) │ │ 0G Compute (TEE)│ │   0G Storage     │
                  │ AeonINFT.sol   │ │ GLM‑5 /         │ │ encrypted memory │
                  │ (ERC‑7857)     │ │ DeepSeek‑V4     │ │ blob → root hash │
                  │ memoryRoot slot│ │ processResponse │ │ (content address)│
                  └──────┬─────────┘ │ → TEE signature │ └─────────────────┘
                         │           └─────────────────┘
                         │ Transfer(from,to,tokenId) event
                         ▼
                  ┌────────────────────────────────────────────┐
                  │ Re‑encryption Oracle  (Cloudflare Worker)   │  ← July 8 build
                  │ 1. read blob from 0G Storage (old root)     │
                  │ 2. decrypt (old owner) inside TEE/KMS       │
                  │ 3. ECIES re‑encrypt → new owner pubkey      │
                  │ 4. re‑upload → new root hash                │
                  │ 5. updateMemoryRoot(tokenId, newRoot)       │
                  └────────────────────────────────────────────┘
```

**Trust boundaries**
- **Client (browser):** holds the user's wallet; signs all user‑initiated transactions; performs client‑side
  ECIES encryption of memory before upload. Never holds the oracle key.
- **0G Compute TEE:** runs inference in a sealed enclave; returns a signed attestation. The provider host
  cannot read plaintext prompts/outputs.
- **Oracle (Worker):** the only component allowed to re‑encrypt memory on transfer; its private key lives in
  Worker secrets/KMS, never in the browser. The contract restricts `updateMemoryRoot` to the oracle/owner.

---

## 3. Component map (files → responsibility)

| Path | Responsibility |
|------|----------------|
| `contracts/AeonINFT.sol` | ERC‑721 + ERC‑2981 INFT. Stores `personaSeed` and `memoryRoot` per token; guards `updateMemoryRoot`; exposes `setOracle`. |
| `contracts/scripts/deploy.ts` | Deploys `AeonINFT` to 0G Chain and prints the address. |
| `app/src/lib/0g/chain.ts` | Wallet connect; mint / transfer / read+update `memoryRoot` via ethers v6. |
| `app/src/lib/0g/compute.ts` | 0G Compute broker: fund → `acknowledgeProviderSigner` → chat (OpenAI‑compatible) → `processResponse` (TEE check). |
| `app/src/lib/0g/storage.ts` | 0G Storage upload of encrypted memory → root hash; browser download via segment API. |
| `app/src/lib/0g/crypto.ts` | ECIES encrypt to owner pubkey / decrypt with owner privkey. |
| `app/src/components/TEEBadge.tsx` | Renders the per‑response "TEE‑verified" proof badge. |
| `app/src/components/MemoryTimeline.tsx` | Renders the on‑chain root‑hash history (the companion's life). |
| `app/src/components/TransferModal.tsx` | Transfer/gift UI. |
| `app/src/App.tsx` | Orchestrates the full flow and state. |
| `oracle/reencrypt.ts` | Re‑encryption oracle (Cloudflare Worker) — July 8 build. |

---

## 4. Data flow (step by step)

### 4.1 Mint
1. User connects MetaMask (`chain.ts:getSigner`). On connect, the app also asks the user to sign a fixed
   message and recovers their **secp256k1 public key** (`App.tsx`), used later for ECIES memory encryption.
2. User submits a one‑line persona. The app calls `AeonINFT.mint(personaSeed, initialRoot)` where
   `initialRoot` is the 0G Storage root hash of an (empty) encrypted memory blob (or `ZeroHash` at MVP).
3. The contract mints the token, stores `personaSeed` and `memoryRoot`, and emits `CompanionMinted`.

### 4.2 Chat (private + verifiable)
1. `compute.ts:initBroker(signer)` → `ensureFunded` (`broker.ledger.depositFund`) → one‑time
   `acknowledgeProviderSigner(provider)` (an on‑chain tx; required before inference).
2. `getServiceMetadata(provider)` → `{ endpoint, model }`; `getRequestHeaders(provider)` → auth headers.
3. `POST {endpoint}/chat/completions` with `{ model, messages }` (OpenAI‑compatible).
4. `processResponse(provider, chatID)` verifies the **TEE signature**; the UI shows `TEEBadge`.

### 4.3 Memory evolution
1. After each turn, the full transcript is serialized and **ECIES‑encrypted to the owner's public key**
   (`crypto.ts:encryptForPubKey`).
2. The ciphertext is uploaded to **0G Storage** (`storage.ts:uploadEncrypted` → `MemData` + `Indexer.upload`),
   returning a **root hash**.
3. The app calls `AeonINFT.updateMemoryRoot(tokenId, newRoot)`; the contract emits `MemoryEvolved`.
4. `MemoryTimeline` appends the new root hash → the companion's memory visibly, verifiably grows.

### 4.4 Transfer (the moment)
1. Owner calls `AeonINFT.transferFrom(owner, recipient, tokenId)`. ERC‑721 emits `Transfer`.
2. **MVP (today):** the new owner sees the companion with a verifiable **"memory sealed"** state — the root
   hash exists on‑chain but is encrypted to the previous owner, so it is not yet readable. Honest, not faked.
3. **July 8:** the oracle Worker catches `Transfer`, reads the blob, **ECIES re‑encrypts old→new owner**,
   re‑uploads to 0G Storage, and calls `updateMemoryRoot` as the authorized `oracle`. The new owner opens the
   companion with full memory.

---

## 5. Smart‑contract architecture (`AeonINFT.sol`)

- **Base:** OpenZeppelin `ERC721` + `ERC2981` (royalties) + `Ownable`.
- **State:**
  - `mapping(uint256 => bytes32) memoryRoot` — 0G Storage pointer to the encrypted memory blob.
  - `mapping(uint256 => string) personaSeed` — the companion's persona/system‑prompt seed.
  - `address oracle` — the trusted re‑encryption oracle.
- **Functions:**
  - `mint(string seed, bytes32 initialRoot) → tokenId`
  - `updateMemoryRoot(tokenId, newRoot)` — **guarded**: `msg.sender == ownerOf(tokenId) || msg.sender == oracle`.
  - `getMemoryRoot(tokenId)` — view with existence check.
  - `setOracle(address)` — owner‑only; lets the July‑8 oracle be authorized without redeploying.
  - `transferFrom` — inherited ERC‑721.
- **Events:** `CompanionMinted`, `MemoryEvolved`, `OracleUpdated`, plus standard `Transfer`.
- **Security‑critical invariant:** `updateMemoryRoot` must never be callable by an arbitrary address. This is
  the single most important access‑control check (otherwise anyone could rewrite a companion's memory pointer).

---

## 6. AI / inference architecture

- **Provider:** 0G Compute Network (decentralized GPU marketplace), accessed via the broker SDK.
- **Models:** primary **GLM‑5** (top‑tier reasoning + tool use); **DeepSeek‑V4** as a long‑context fallback
  (1M tokens) for large memories. Both are OpenAI‑compatible and TEE‑served.
- **Verifiability:** every response is checked with `processResponse`, which validates the TEE signature. The
  app treats a response as trusted only after this check; the badge reflects the result.
- **Context strategy:** the system prompt = `personaSeed`; recent turns are sent verbatim. For long histories
  (July 8), periodic LLM‑generated "memory summaries" keep the context window small while preserving continuity.

---

## 7. Storage + encryption model

- **Substrate:** 0G Storage — content‑addressed, S3‑class throughput, ~95% cheaper than S3, decentralized.
- **What is stored:** the companion's memory transcript, **encrypted client‑side** before upload.
- **Encryption:** ECIES to the owner's secp256k1 public key (recovered from a signed message at connect).
  Only the holder of the matching private key (the wallet owner) can decrypt. Non‑custodial by construction.
- **Pointer:** the upload's **root hash** is written on‑chain as `memoryRoot`. The on‑chain pointer is what
  makes the memory verifiable: the contract proves *which* blob is this companion's current memory.
- **Browser caveat:** standard `indexer.download()` does not work in the browser. Reads use
  `StorageNode.downloadSegmentByTxSeq()` (or a thin serverless proxy). Uploads (user‑signed) work in‑browser.

---

## 8. The re‑encryption oracle (July 8)

The oracle is the ERC‑7857 "memory travels with the companion" mechanism, implemented as a Cloudflare Worker
(no cold start, low latency for the live demo):

1. Observe `Transfer(from, to, tokenId)` from `AeonINFT`.
2. Read the encrypted blob from 0G Storage by the current `memoryRoot`.
3. Decrypt with the previous owner's key **inside the trusted environment** (TEE/KMS).
4. **ECIES re‑encrypt** to the new owner's public key.
5. Re‑upload to 0G Storage → new root hash.
6. Call `AeonINFT.updateMemoryRoot(tokenId, newRoot)` as the authorized `oracle` address.

**Key isolation:** the oracle's private key lives only in Worker secrets/KMS — never client‑side. This is the
one place keys cannot be in the browser, and the contract's `onlyOwnerOrOracle` guard enforces who may write.

---

## 9. Security model (summary)

| Concern | Mitigation |
|---------|-----------|
| Provider reading private chats | 0G Compute TEE + `processResponse` attestation (provable, not promised). |
| Memory readable by storage nodes | Client‑side ECIES encryption to owner pubkey before upload. |
| Unauthorized memory rewrite | `updateMemoryRoot` restricted to owner/oracle. |
| Oracle key leakage | Oracle key in Worker secrets/KMS only; never shipped to the client. |
| Faking the transfer demo | MVP shows an honest "sealed memory" state; re‑encryption is clearly roadmap until July 8. |
| Demo flakiness (provider/RPC) | Pin a tested provider, pre‑fund wallets + broker, pre‑warm inference, record a backup video. |

---

## 10. Why this is impossible (or much weaker) without 0G

| Remove… | …and Aeon becomes |
|---------|-------------------|
| INFT / 0G Chain | a chatbot you don't own and can't transfer |
| 0G Compute TEE | a chatbot whose privacy is an unverifiable promise |
| 0G Storage | a chatbot with no portable, verifiable, growing memory |
| Oracle | a transfer that loses the soul (memory can't move privately) |

Every pillar does real, non‑substitutable work — the cleanest possible pass on the Zero Cup "no bolt‑ons" rule.

---

## 11. Environment / configuration

App (`app/.env`):
```
VITE_ZG_RPC=https://evmrpc-testnet.0g.ai      # verify current testnet RPC
VITE_ZG_CHAIN_ID=16601                         # verify current testnet chainId
VITE_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
VITE_AEON_CONTRACT=0x...                        # from deploy output
VITE_COMPUTE_PROVIDER=0x...                     # pinned, tested provider
VITE_DEFAULT_MODEL=glm-5
```
Contracts (`contracts/.env`): `PRIVATE_KEY`, `ZG_RPC`.

**Verify‑before‑deploy:** current 0G testnet chainId/RPC/indexer; broker package name
(`@0glabs/0g-serving-broker` vs `0gfoundation/0g-serving-user-broker`); SDK method signatures against the
installed version; browser download via `downloadSegmentByTxSeq()`.
