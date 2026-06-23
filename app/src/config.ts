// Client config. Only VITE_* values are exposed to the browser.
// Server secrets (router key, storage key) live in the API env, never here.
export const CONFIG = {
  // 0G Galileo testnet. VERIFY against https://docs.0g.ai if values change.
  ZG_RPC: import.meta.env.VITE_ZG_RPC ?? "https://evmrpc-testnet.0g.ai",
  ZG_CHAIN_ID: Number(import.meta.env.VITE_ZG_CHAIN_ID ?? 16602),
  EXPLORER: import.meta.env.VITE_EXPLORER ?? "https://chainscan-galileo.0g.ai",

  // Deployed AeonINFT address (from contracts/scripts/deploy.ts output).
  AEON_CONTRACT: import.meta.env.VITE_AEON_CONTRACT ?? "",

  // Chat/storage run through the server API (same origin: /api/*).
  API_BASE: import.meta.env.VITE_API_BASE ?? "",
};

export const CHAIN_ID_HEX = "0x" + CONFIG.ZG_CHAIN_ID.toString(16);

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
