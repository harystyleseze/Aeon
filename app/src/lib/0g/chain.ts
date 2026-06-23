import { BrowserProvider, Contract, JsonRpcSigner } from "ethers";
import { AEON_ABI, CHAIN_ID_HEX, CONFIG } from "../../config";

/** Ensure the wallet is on 0G Galileo testnet (switch, or add it if unknown). */
export async function ensureNetwork(): Promise<void> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("Please install MetaMask");
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID_HEX }] });
  } catch (err: any) {
    // 4902 = chain not added to the wallet yet
    if (err?.code === 4902 || /Unrecognized chain/i.test(err?.message || "")) {
      await eth.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: "0G Galileo Testnet",
            nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
            rpcUrls: [CONFIG.ZG_RPC],
            blockExplorerUrls: [CONFIG.EXPLORER],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

export async function getSigner(): Promise<JsonRpcSigner> {
  const eth = (window as any).ethereum;
  if (!eth) throw new Error("Please install MetaMask");
  const provider = new BrowserProvider(eth);
  await provider.send("eth_requestAccounts", []);
  await ensureNetwork();
  return provider.getSigner();
}

export function getAeon(signer: JsonRpcSigner): Contract {
  if (!CONFIG.AEON_CONTRACT) throw new Error("Set VITE_AEON_CONTRACT");
  return new Contract(CONFIG.AEON_CONTRACT, AEON_ABI, signer);
}

/** Mint a companion. initialRoot is a bytes32 0G Storage root hash (or zero blob). */
export async function mintCompanion(
  signer: JsonRpcSigner,
  personaSeed: string,
  initialRoot: string
): Promise<{ tokenId: bigint; txHash: string }> {
  const aeon = getAeon(signer);
  const tx = await aeon.mint(personaSeed, initialRoot);
  const receipt = await tx.wait();
  // Parse CompanionMinted to get tokenId
  let tokenId = 0n;
  for (const log of receipt.logs) {
    try {
      const parsed = aeon.interface.parseLog(log);
      if (parsed?.name === "CompanionMinted") tokenId = parsed.args.tokenId;
    } catch {
      /* not our event */
    }
  }
  return { tokenId, txHash: receipt.hash };
}

export async function updateMemoryRoot(
  signer: JsonRpcSigner,
  tokenId: bigint,
  newRoot: string
): Promise<string> {
  const aeon = getAeon(signer);
  const tx = await aeon.updateMemoryRoot(tokenId, newRoot);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function transferCompanion(
  signer: JsonRpcSigner,
  to: string,
  tokenId: bigint
): Promise<string> {
  const aeon = getAeon(signer);
  const from = await signer.getAddress();
  const tx = await aeon.transferFrom(from, to, tokenId);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function readMemoryRoot(
  signer: JsonRpcSigner,
  tokenId: bigint
): Promise<string> {
  const aeon = getAeon(signer);
  return aeon.getMemoryRoot(tokenId);
}
