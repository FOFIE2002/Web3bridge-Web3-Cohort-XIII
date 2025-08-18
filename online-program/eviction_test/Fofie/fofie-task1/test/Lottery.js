const { expect } = require("chai");
const { ethers } = require("hardhat");

const FEE = ethers.parseEther("0.01");
const MAX = 10n;

describe("Lottery", function () {
  async function deploy() {
    const [deployer, ...signers] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(FEE, MAX);
    await lottery.waitForDeployment();
    return { lottery, deployer, signers };
  }

  it("requires the exact entry fee", async () => {
    const { lottery, signers } = await deploy();
    await expect(lottery.connect(signers[0]).enter({ value: ethers.parseEther("0.009") }))
      .to.be.revertedWith("Incorrect entry fee");
    await expect(lottery.connect(signers[0]).enter({ value: ethers.parseEther("0.02") }))
      .to.be.revertedWith("Incorrect entry fee");
    await expect(lottery.connect(signers[0]).enter({ value: FEE }))
      .to.emit(lottery, "PlayerJoined");
  });

  it("tracks players & blocks duplicate entry per round", async () => {
    const { lottery, signers } = await deploy();
    await lottery.connect(signers[0]).enter({ value: FEE });
    await lottery.connect(signers[1]).enter({ value: FEE });

    const players = await lottery.getPlayers();
    expect(players).to.have.lengthOf(2);
    expect(players[0]).to.equal(signers[0].address);

    await expect(lottery.connect(signers[0]).enter({ value: FEE }))
      .to.be.revertedWith("Already entered this round");
  });

  it("only picks a winner at 10 players and resets", async () => {
    const { lottery, signers } = await deploy();

    for (let i = 0; i < 9; i++) {
      await lottery.connect(signers[i]).enter({ value: FEE });
    }

    await expect(lottery.connect(signers[9]).enter({ value: FEE }))
      .to.emit(lottery, "WinnerChosen");

    expect(await lottery.playersCount()).to.equal(0n);
    expect(await ethers.provider.getBalance(await lottery.getAddress())).to.equal(0n);
  });

  it("allows the same address to join the next round", async () => {
    const { lottery, signers } = await deploy();

    for (let i = 0; i < Number(MAX); i++) {
      await lottery.connect(signers[i]).enter({ value: FEE });
    }

    await expect(lottery.connect(signers[0]).enter({ value: FEE }))
      .to.emit(lottery, "PlayerJoined");
  });
});
