import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

// NOTE: confirm the current 0G testnet chainId + RPC in the 0G docs before deploying.
// As of writing: EVM RPC https://evmrpc-testnet.0g.ai
const PRIVATE_KEY = process.env.PRIVATE_KEY ?? "";
const ZG_RPC = process.env.ZG_RPC ?? "https://evmrpc-testnet.0g.ai";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    zerogTestnet: {
      url: ZG_RPC,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      // chainId: 16601, // <-- VERIFY current 0G testnet chainId before deploy
    },
  },
};

export default config;
