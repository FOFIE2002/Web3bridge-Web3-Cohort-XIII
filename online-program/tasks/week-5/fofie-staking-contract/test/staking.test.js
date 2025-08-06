const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingContract", function () {
  let tokenA, tokenB, staking;
  let owner, user;
  const stakeAmount = ethers.utils.parseEther("100");
  const lockPeriod = 60; // seconds

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy Token A
    const TokenA = await ethers.getContractFactory("MockToken");
    tokenA = await TokenA.deploy("Token A", "TKA");
    await tokenA.deployed();

    // Deploy Token B
    const TokenB = await ethers.getContractFactory("MockMintableToken");
    tokenB = await TokenB.deploy("Token B", "TKB");
    await tokenB.deployed();

    // Mint Token A to user
    await tokenA.mint(user.address, ethers.utils.parseEther("1000"));

    // Deploy Staking Contract
    const Staking = await ethers.getContractFactory("StakingContract");
    staking = await Staking.deploy(tokenA.address, tokenB.address, lockPeriod);
    await staking.deployed();
  });

  it("should allow a user to stake and receive Token B", async () => {
    await tokenA.connect(user).approve(staking.address, stakeAmount);
    await staking.connect(user).stake(stakeAmount);

    const tokenBBalance = await tokenB.balanceOf(user.address);
    expect(tokenBBalance).to.equal(stakeAmount);

    const stakeInfo = await staking.getStakeInfo(user.address);
    expect(stakeInfo.amount).to.equal(stakeAmount);
    expect(stakeInfo.unlockTime).to.be.above(0);
  });

  it("should not allow unstaking before lock period", async () => {
    await tokenA.connect(user).approve(staking.address, stakeAmount);
    await staking.connect(user).stake(stakeAmount);

    await tokenB.connect(user).approve(staking.address, stakeAmount);

    await expect(
      staking.connect(user).unstake(stakeAmount)
    ).to.be.revertedWith("Still locked");
  });

  it("should allow unstaking after lock period and burn Token B", async function () {
    await tokenA.connect(user).approve(staking.address, stakeAmount);
    await staking.connect(user).stake(stakeAmount);

    // Fast-forward time (simulate 60 seconds passing)
    await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
    await ethers.provider.send("evm_mine");

    await tokenB.connect(user).approve(staking.address, stakeAmount);

    const tokenABefore = await tokenA.balanceOf(user.address);
    await staking.connect(user).unstake(stakeAmount);
    const tokenAAfter = await tokenA.balanceOf(user.address);

    const tokenBBalance = await tokenB.balanceOf(user.address);
    expect(tokenBBalance).to.equal(0);

    expect(tokenAAfter).to.be.gt(tokenABefore);
  });

  it("should not allow staking 0 amount", async () => {
    await tokenA.connect(user).approve(staking.address, 0);
    await expect(
      staking.connect(user).stake(0)
    ).to.be.revertedWith("Amount must be greater than 0");
  });

  it("should not allow unstaking more than staked", async () => {
    await tokenA.connect(user).approve(staking.address, stakeAmount);
    await staking.connect(user).stake(stakeAmount);

    await ethers.provider.send("evm_increaseTime", [lockPeriod + 1]);
    await ethers.provider.send("evm_mine");

    await tokenB.connect(user).approve(staking.address, stakeAmount);

    // Try unstaking more than staked
    await expect(
      staking.connect(user).unstake(stakeAmount.add(1))
    ).to.be.revertedWith("Not enough staked");
  });
});
