import { Indexer, MemData } from "@0gfoundation/0g-storage-ts-sdk";
import type { JsonRpcSigner } from "ethers";
import { CONFIG } from "../../config";

/**
 * 0G Storage: upload the encrypted memory blob, get a root hash (the on-chain pointer).
 *
 * BROWSER CAVEAT (from 0G docs): the standard `indexer.download()` does not work in the
 * browser — use segment-based download (downloadSegmentByTxSeq) via a StorageNode client,
 * or proxy downloads through a thin serverless endpoint. For the demo we upload from the
 * browser (user-signed) and read back via the segment API.
 */

let indexer: Indexer | null = null;
function getIndexer(): Indexer {
  if (!indexer) indexer = new Indexer(CONFIG.INDEXER_RPC);
  return indexer;
}

/** Upload encrypted bytes; returns the 0G Storage root hash (bytes32-compatible hex). */
export async function uploadEncrypted(
  signer: JsonRpcSigner,
  data: Uint8Array
): Promise<{ rootHash: string; txHash: string }> {
  const idx = getIndexer();
  const mem = new MemData(Buffer.from(data));
  const [tree, treeErr] = await mem.merkleTree();
  if (treeErr) throw treeErr;
  const rootHash = tree?.rootHash?.() ?? tree?.rootHash ?? "";

  // Upload signs with the user's wallet via the EVM RPC.
  const [tx, uploadErr] = await idx.upload(mem as any, CONFIG.ZG_RPC, signer as any);
  if (uploadErr) throw uploadErr;

  return { rootHash: String(rootHash), txHash: String(tx) };
}

/**
 * Download by root hash. In the browser, prefer a segment download or a serverless proxy.
 * This helper is a placeholder that should call StorageNode.downloadSegmentByTxSeq() or a
 * /api/download?root=... edge function. Returns the encrypted bytes.
 */
export async function downloadEncrypted(rootHash: string): Promise<Uint8Array> {
  // TODO (build): implement segment download or serverless proxy per 0G docs.
  // For the group-stage "sealed memory" demo we only need to PROVE the blob exists
  // on-chain (via the root hash); full client-side download lands with the oracle build.
  throw new Error(
    `downloadEncrypted not yet wired for root ${rootHash} — use segment download / edge proxy`
  );
}
