const { ethers } = require("hardhat");

async function main() {
  const entryFeeWei = ethers.parseEther("0.01");
  const maxPlayers = 10n;

  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(entryFeeWei, maxPlayers);
  await lottery.waitForDeployment();

  const addr = await lottery.getAddress();
  console.log("Lottery deployed to:", addr);
  console.log("Constructor args:", entryFeeWei.toString(), maxPlayers.toString());
}

main().catch((e) => { console.error(e); process.exit(1); });
