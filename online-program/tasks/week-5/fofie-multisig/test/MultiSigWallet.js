const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigWallet", function () {
  let MultiSigWallet, wallet, owner1, owner2, owner3, recipient;

  beforeEach(async function () {
    [owner1, owner2, owner3, recipient] = await ethers.getSigners();
    const owners = [owner1.address, owner2.address, owner3.address];
    const required = 2;

    MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    wallet = await MultiSigWallet.deploy(owners, required);
    await wallet.deployed();

    // Fund the wallet with ETH
    await owner1.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("5"),
    });
  });

  it("should submit and confirm a transaction", async function () {
    const tx = await wallet.connect(owner1).submitTransaction(
      recipient.address,
      ethers.utils.parseEther("1"),
      "0x"
    );

    const txId = (await wallet.getTransactionCount()) - 1;

    await wallet.connect(owner1).confirmTransaction(txId);
    await wallet.connect(owner2).confirmTransaction(txId);

    const txn = await wallet.getTransaction(txId);
    expect(txn.confirmations).to.equal(2);

    await expect(() =>
      wallet.connect(owner3).executeTransaction(txId)
    ).to.changeEtherBalance(recipient, ethers.utils.parseEther("1"));
  });

  it("should not execute with insufficient confirmations", async function () {
    const tx = await wallet.connect(owner1).submitTransaction(
      recipient.address,
      ethers.utils.parseEther("1"),
      "0x"
    );

    const txId = (await wallet.getTransactionCount()) - 1;
    await wallet.connect(owner1).confirmTransaction(txId);

    await expect(wallet.executeTransaction(txId)).to.be.revertedWith("Not enough confirmations");
  });

  it("should revoke confirmation", async function () {
    await wallet.submitTransaction(recipient.address, ethers.utils.parseEther("1"), "0x");
    const txId = (await wallet.getTransactionCount()) - 1;

    await wallet.connect(owner1).confirmTransaction(txId);
    await wallet.connect(owner1).revokeConfirmation(txId);

    const txn = await wallet.getTransaction(txId);
    expect(txn.confirmations).to.equal(0);
  });
});
