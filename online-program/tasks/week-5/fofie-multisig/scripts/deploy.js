const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contract with:", deployer.address);

  const owners = [
    "0x2380cbad38d9980ba7e9c10db533880bb5e153ba",
    "0xc0ffee254729296a45a3885639AC7E10F9d54979",
    "0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E",
  ];
  const requiredConfirmations = 2;

  const MultiSigWallet = await hre.ethers.getContractFactory("MultiSigWallet");
  const wallet = await MultiSigWallet.deploy(owners, requiredConfirmations);

  await wallet.deployed();

  console.log("MultiSigWallet deployed to:", wallet.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
