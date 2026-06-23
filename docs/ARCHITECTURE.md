# Aeon — Architecture

A technical reference for Aeon: system design, components, data flows, the smart-contract specification, the
AI/inference layer, the storage and encryption model, the security model, and the trust boundaries. It also
states clearly what is implemented today and what is planned.

---

## 1. Overview

Aeon is an AI companion represented as an on-chain asset. A companion is minted as an **ERC-7857 Intelligent
NFT (INFT)** on **0G Chain**. Conversations are processed inside a **0G Compute Trusted Execution Environment
(TEE)**; the application verifies a per-response signature so that the privacy property is demonstrable rather
than merely asserted. The companion's **memory is encrypted on the client and stored on 0G Storage**, and an
on-chain pointer (`memoryRoot`) is updated as the memory grows, producing a verifiable history.

The design goal is that each 0G component performs non-substitutable work: ownership and transfer (Chain/INFT),
verifiable private inference (Compute/TEE), and portable encrypted memory with an on-chain pointer (Storage).

---

## 2. Design goals

- **Ownership** of a personal AI as a first-class, transferable asset.
- **Verifiable privacy** for inference, not policy-based assurances.
- **Portable, evolving memory** that is encrypted client-side and anchored on-chain.
- **Non-custodial by default**: the user signs their own transactions and their memory is encrypted to their
  own key.
- **Clear trust boundaries** between the client, the compute enclave, and the (planned) re-encryption oracle.

---

## 3. System architecture

```
                          ┌──────────────────────────────────────────────┐
   Browser (Vite/React)   │  Aeon dApp                                    │
   + MetaMask  ───────────┤  Mint · Chat · Memory Timeline · Transfer UI  │
                          │  ethers v6 BrowserProvider signer             │
                          └───┬───────────────┬───────────────┬──────────┘
            (1) mint/transfer │   (2) chat     │  (3) encrypt + store
                              ▼               ▼               ▼
                  ┌────────────────┐ ┌─────────────────┐ ┌─────────────────┐
                  │ 0G Chain (EVM) │ │ 0G Compute (TEE)│ │   0G Storage     │
                  │ AeonINFT.sol   │ │ GLM-5 /         │ │ encrypted memory │
                  │ (ERC-7857)     │ │ DeepSeek-V4     │ │ blob → root hash │
                  │ memoryRoot slot│ │ processResponse │ │ (content address)│
                  └──────┬─────────┘ │ → TEE signature │ └─────────────────┘
                         │           └─────────────────┘
                         │ Transfer(from,to,tokenId) event
                         ▼
                  ┌────────────────────────────────────────────┐
                  │ Re-encryption Oracle  (Cloudflare Worker)   │  (Planned)
                  │ 1. read blob from 0G Storage (old root)     │
                  │ 2. decrypt (old owner) inside TEE/KMS       │
                  │ 3. ECIES re-encrypt → new owner pubkey      │
                  │ 4. re-upload → new root hash                │
                  │ 5. updateMemoryRoot(tokenId, newRoot)       │
                  └────────────────────────────────────────────┘
```

**Trust boundaries**
- **Client (browser):** holds the user's wallet, signs all user-initiated transactions, and performs
  client-side ECIES encryption of memory before upload. It never holds the oracle key.
- **0G Compute TEE:** runs inference inside an enclave and returns a signed attestation. The provider host is
  not able to read plaintext prompts or outputs.
- **Re-encryption oracle (planned):** the only component permitted to re-encrypt memory on transfer; its
  private key is held in Worker secrets/KMS, never in the browser. The contract restricts `updateMemoryRoot`
  to the owner or the oracle address.

---

## 4. Component map

| Path | Responsibility | Status |
|------|----------------|--------|
| `contracts/AeonINFT.sol` | ERC-721 + ERC-2981 INFT. Stores `personaSeed` and `memoryRoot`; guards `updateMemoryRoot`; exposes `setOracle`. | Implemented |
| `contracts/scripts/deploy.ts` | Deploys `AeonINFT` to 0G Chain and prints the address. | Implemented |
| `app/src/lib/0g/chain.ts` | Wallet connect; mint / transfer / read+update `memoryRoot` via ethers v6. | Implemented |
| `app/src/lib/0g/compute.ts` | 0G Compute broker: fund → `acknowledgeProviderSigner` → chat (OpenAI-compatible) → `processResponse` (TEE check). | Implemented |
| `app/src/lib/0g/storage.ts` | 0G Storage upload of encrypted memory → root hash. Browser download is a stub. | Upload implemented; download planned |
| `app/src/lib/0g/crypto.ts` | ECIES encrypt to owner pubkey / decrypt with owner privkey. | Implemented |
| `app/src/components/TEEBadge.tsx` | Renders the per-response TEE verification badge. | Implemented |
| `app/src/components/MemoryTimeline.tsx` | Renders the on-chain root-hash history. | Implemented |
| `app/src/components/TransferModal.tsx` | Transfer UI. | Implemented |
| `app/src/App.tsx` | Orchestrates the full flow and state. | Implemented |
| `oracle/reencrypt.ts` | Re-encryption oracle (Cloudflare Worker). | Stub (planned) |

---

## 5. Data flows

### 5.1 Mint
1. The user connects MetaMask (`chain.ts:getSigner`). On connect, the application asks the user to sign a fixed
   message and recovers their **secp256k1 public key** (`App.tsx`), used later for ECIES memory encryption.
2. The user submits a one-line persona. The application calls `AeonINFT.mint(personaSeed, initialRoot)`, where
   `initialRoot` is the 0G Storage root hash of the initial encrypted memory blob (the current build uses
   `ZeroHash` as the initial value).
3. The contract mints the token, stores `personaSeed` and `memoryRoot`, and emits `CompanionMinted`.

### 5.2 Chat (private and verifiable)
1. `compute.ts:initBroker(signer)` → `ensureFunded` (`broker.ledger.depositFund`) → one-time
   `acknowledgeProviderSigner(provider)` (an on-chain transaction required before inference).
2. `getServiceMetadata(provider)` returns `{ endpoint, model }`; `getRequestHeaders(provider)` returns the
   authentication headers.
3. The client sends `POST {endpoint}/chat/completions` with `{ model, messages }` (OpenAI-compatible).
4. `processResponse(provider, chatID)` verifies the **TEE signature**; the UI reflects the result via
   `TEEBadge`.

### 5.3 Memory evolution
1. After each turn, the transcript is serialized and **ECIES-encrypted to the owner's public key**
   (`crypto.ts:encryptForPubKey`).
2. The ciphertext is uploaded to **0G Storage** (`storage.ts:uploadEncrypted` → `MemData` + `Indexer.upload`),
   returning a **root hash**.
3. The application calls `AeonINFT.updateMemoryRoot(tokenId, newRoot)`; the contract emits `MemoryEvolved`.
4. `MemoryTimeline` appends the new root hash, providing a verifiable record of how the memory grows.

> Read path: uploads and the on-chain pointer are implemented. Browser-side download and decryption of memory
> (`storage.ts:downloadEncrypted`) is not yet implemented and requires segment-based download (see §8).

### 5.4 Transfer
1. The owner calls `AeonINFT.transferFrom(owner, recipient, tokenId)`; ERC-721 emits `Transfer`.
2. **Current behavior:** ownership changes on-chain immediately. The new owner sees the companion with a
   verifiable **"memory sealed"** state — the `memoryRoot` exists on-chain, but the blob remains encrypted to
   the previous owner and is therefore not readable by the new owner.
3. **Planned behavior:** the re-encryption oracle observes `Transfer`, reads the blob, re-encrypts it from the
   previous owner's key to the new owner's key, re-uploads to 0G Storage, and calls `updateMemoryRoot` as the
   authorized `oracle`. The new owner can then access the memory. See §9.

---

## 6. Smart-contract specification (`AeonINFT.sol`)

- **Base:** OpenZeppelin `ERC721` + `ERC2981` (royalties) + `Ownable`.
- **State:**
  - `mapping(uint256 => bytes32) memoryRoot` — the 0G Storage pointer to the encrypted memory blob.
  - `mapping(uint256 => string) personaSeed` — the companion's persona / system-prompt seed.
  - `address oracle` — the trusted re-encryption oracle address.
- **Functions:**
  - `mint(string seed, bytes32 initialRoot) → tokenId`
  - `updateMemoryRoot(tokenId, newRoot)` — guarded: `msg.sender == ownerOf(tokenId) || msg.sender == oracle`.
  - `getMemoryRoot(tokenId)` — view, with an existence check.
  - `setOracle(address)` — owner-only; authorizes the oracle without redeploying.
  - `transferFrom` — inherited from ERC-721.
- **Events:** `CompanionMinted`, `MemoryEvolved`, `OracleUpdated`, and the standard `Transfer`.
- **Security-critical invariant:** `updateMemoryRoot` must not be callable by an arbitrary address; otherwise
  any account could overwrite a companion's memory pointer. This is the most important access-control check.

---

## 7. AI / inference layer

- **Provider:** the 0G Compute Network, accessed through the broker SDK.
- **Models:** GLM-5 as the primary model; DeepSeek-V4 as a long-context option for larger memories. Both are
  OpenAI-compatible and TEE-served.
- **Verifiability:** every response is checked with `processResponse`, which validates the TEE signature; the
  application reflects this result in the UI.
- **Context strategy:** the system prompt is derived from `personaSeed`; recent turns are sent verbatim. For
  long histories, a planned memory-summary step keeps the context window bounded while preserving continuity.

---

## 8. Storage and encryption model

- **Substrate:** 0G Storage — content-addressed, decentralized object storage suited to large AI workloads.
- **What is stored:** the companion's memory transcript, encrypted on the client before upload.
- **Encryption:** ECIES to the owner's secp256k1 public key (recovered from a signed message on connect). Only
  the holder of the corresponding private key can decrypt, so the scheme is non-custodial by construction.
- **Pointer:** the upload's **root hash** is written on-chain as `memoryRoot`, which lets the contract identify
  the current memory blob for a given token.
- **Browser read caveat:** the standard `indexer.download()` is not suitable in the browser; reads should use
  segment-based download (`StorageNode.downloadSegmentByTxSeq()`) or a thin serverless proxy. Uploads
  (user-signed) work in the browser. The current `storage.ts:downloadEncrypted` is a stub.

---

## 9. Re-encryption oracle (planned)

The oracle implements the ERC-7857 mechanism for moving memory to a new owner on transfer. It is intended to
run as a Cloudflare Worker:

1. Observe `Transfer(from, to, tokenId)` from `AeonINFT`.
2. Read the encrypted blob from 0G Storage by the current `memoryRoot`.
3. Decrypt with the previous owner's key inside the trusted environment (TEE/KMS).
4. Re-encrypt (ECIES) to the new owner's public key.
5. Re-upload to 0G Storage to obtain a new root hash.
6. Call `AeonINFT.updateMemoryRoot(tokenId, newRoot)` as the authorized `oracle` address.

**Key isolation:** the oracle's private key is held only in Worker secrets/KMS and is never shipped to the
client. The contract's owner-or-oracle guard on `updateMemoryRoot` enforces who may update the pointer. This is
the one place where keys cannot reside in the browser. The current implementation (`oracle/reencrypt.ts`) is a
stub.

---

## 10. Security model

| Concern | Mitigation |
|---------|-----------|
| Inference provider reading private conversations | 0G Compute TEE with `processResponse` signature verification. |
| Memory readable by storage nodes | Client-side ECIES encryption to the owner's public key before upload. |
| Unauthorized rewrite of a companion's memory pointer | `updateMemoryRoot` restricted to the owner or oracle. |
| Oracle key exposure | Oracle key held in Worker secrets/KMS; never shipped to the client. |
| Loss of memory on transfer | Re-encryption oracle (planned); until then the new owner sees a verifiable "sealed" state rather than silent data loss. |

---

## 11. Why 0G is required

| Component removed | Resulting limitation |
|-------------------|----------------------|
| INFT / 0G Chain | The companion can no longer be owned or transferred as an asset. |
| 0G Compute TEE | Privacy becomes a policy claim that cannot be verified. |
| 0G Storage | Memory is no longer portable, verifiable, or anchored on-chain. |
| Re-encryption oracle | Memory cannot be securely handed to a new owner on transfer. |

Each pillar performs work that is not readily replaced by a conventional stack; together they satisfy the
requirement that 0G performs substantive work in the application rather than acting as an optional add-on.

---

## 12. Configuration and implementation notes

Application (`app/.env`):
```
VITE_ZG_RPC=https://evmrpc-testnet.0g.ai      # confirm current testnet RPC
VITE_ZG_CHAIN_ID=16601                         # confirm current testnet chainId
VITE_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai
VITE_AEON_CONTRACT=0x...                        # from deploy output
VITE_COMPUTE_PROVIDER=0x...                     # selected provider
VITE_DEFAULT_MODEL=glm-5
```
Contracts (`contracts/.env`): `PRIVATE_KEY`, `ZG_RPC`.

Before deployment, confirm: the current 0G testnet chainId/RPC/indexer; the broker package name
(`@0glabs/0g-serving-broker` vs `0gfoundation/0g-serving-user-broker`) and method signatures against the
installed version; and browser download via `downloadSegmentByTxSeq()`.

---

## 13. Current status and roadmap

**Implemented:** `AeonINFT` contract; mint and on-chain ownership; 0G Compute chat with TEE verification;
client-side ECIES encryption; 0G Storage upload with on-chain `memoryRoot` updates; memory timeline; on-chain
transfer with a verifiable sealed-memory state.

**Planned:** the re-encryption oracle; browser-side memory download and decryption; voice and avatar
modalities; marketplace and royalties UI; memory-summary RAG; a contract test suite and audit.
