const { ethers } = require("hardhat");
const FEE = ethers.parseEther("0.01");
const MAX = 10n;

async function main() {
  const [deployer, ...signers] = await ethers.getSigners();

  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(FEE, MAX);
  await lottery.waitForDeployment();
  const addr = await lottery.getAddress();
  console.log("Deployed:", addr);

  for (let i = 0; i < 10; i++) {
    const tx = await lottery.connect(signers[i]).enter({ value: FEE });
    const rc = await tx.wait();

    for (const log of rc.logs) {
      try {
        const parsed = lottery.interface.parseLog(log);
        if (parsed?.name === "WinnerChosen") {
          console.log("Winner:", parsed.args.winner, "Prize:", ethers.formatEther(parsed.args.amount), "ETH");
        }
      } catch {}
    }
  }

  console.log("Players after reset:", (await lottery.playersCount()).toString());
}

main().catch((e) => { console.error(e); process.exit(1); });
