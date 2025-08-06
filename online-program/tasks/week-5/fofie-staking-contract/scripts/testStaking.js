const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer, user] = await ethers.getSigners();

  // Deploy Token A
  const TokenA = await ethers.getContractFactory("MockToken");
  const tokenA = await TokenA.deploy("Token A", "TKA");
  await tokenA.deployed();

  // Deploy Token B
  const TokenB = await ethers.getContractFactory("MockMintableToken");
  const tokenB = await TokenB.deploy("Token B", "TKB");
  await tokenB.deployed();

  // Mint Token A to user
  await tokenA.mint(user.address, ethers.utils.parseEther("1000"));

  // Deploy Staking Contract (60 seconds lock)
  const Staking = await ethers.getContractFactory("StakingContract");
  const staking = await Staking.deploy(tokenA.address, tokenB.address, 60);
  await staking.deployed();

  console.log("Token A deployed to:", tokenA.address);
  console.log("Token B deployed to:", tokenB.address);
  console.log("Staking contract deployed to:", staking.address);

  // Interactions
  const tokenAUser = tokenA.connect(user);
  const tokenBUser = tokenB.connect(user);
  const stakingUser = staking.connect(user);

  await tokenAUser.approve(staking.address, ethers.utils.parseEther("100"));
  await stakingUser.stake(ethers.utils.parseEther("100"));

  console.log("✅ Staked 100 TKA");

  let bBal = await tokenB.balanceOf(user.address);
  console.log("Token B minted:", ethers.utils.formatEther(bBal));

  console.log("⏳ Waiting 61 seconds...");
  await new Promise(resolve => setTimeout(resolve, 61000));

  await tokenBUser.approve(staking.address, ethers.utils.parseEther("100"));
  await stakingUser.unstake(ethers.utils.parseEther("100"));

  console.log("✅ Unstaked 100 TKA");
}
