// Central config. Fill via app/.env (Vite exposes VITE_*).
export const CONFIG = {
  // 0G Chain (testnet). VERIFY current values in the 0G docs.
  ZG_RPC: import.meta.env.VITE_ZG_RPC ?? "https://evmrpc-testnet.0g.ai",
  ZG_CHAIN_ID: Number(import.meta.env.VITE_ZG_CHAIN_ID ?? 16601), // <-- verify

  // 0G Storage
  INDEXER_RPC:
    import.meta.env.VITE_INDEXER_RPC ??
    "https://indexer-storage-testnet-turbo.0g.ai",

  // Deployed AeonINFT address (from contracts/scripts/deploy.ts output)
  AEON_CONTRACT: import.meta.env.VITE_AEON_CONTRACT ?? "",

  // 0G Compute provider address to pin for the demo (call broker.inference.listService()
  // once, pick a tested chatbot provider, and hard-code it here for reliability).
  COMPUTE_PROVIDER: import.meta.env.VITE_COMPUTE_PROVIDER ?? "",

  // Default model id served by the chosen provider (e.g. GLM-5). getServiceMetadata()
  // also returns the model; this is a UI hint/fallback.
  DEFAULT_MODEL: import.meta.env.VITE_DEFAULT_MODEL ?? "glm-5",
};

// Minimal ABI for the AeonINFT contract (matches AeonINFT.sol).
export const AEON_ABI = [
  "function mint(string seed, bytes32 initialRoot) returns (uint256)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function updateMemoryRoot(uint256 tokenId, bytes32 newRoot)",
  "function getMemoryRoot(uint256 tokenId) view returns (bytes32)",
  "function personaSeed(uint256 tokenId) view returns (string)",
  "event CompanionMinted(uint256 indexed tokenId, address indexed owner, bytes32 initialRoot)",
  "event MemoryEvolved(uint256 indexed tokenId, bytes32 newRoot, address indexed updatedBy)",
];
