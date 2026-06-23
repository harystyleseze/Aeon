import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying AeonINFT with:", deployer.address);

  const royaltyReceiver = deployer.address;
  const royaltyBips = 500; // 5% secondary-market royalty (EIP-2981)

  const Aeon = await ethers.getContractFactory("AeonINFT");
  const aeon = await Aeon.deploy(royaltyReceiver, royaltyBips);
  await aeon.waitForDeployment();

  const addr = await aeon.getAddress();
  console.log("AeonINFT deployed to:", addr);
  console.log("Set VITE_AEON_CONTRACT=", addr, "in app/.env");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
