// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

interface IMintableBurnableERC20 is IERC20 {
    function mint(address to, uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
}

contract StakingContract {
    IERC20 public tokenA;
    IMintableBurnableERC20 public tokenB;
    uint256 public lockPeriod;

    struct Stake {
        uint256 amount;
        uint256 unlockTime;
    }

    mapping(address => Stake) public stakes;

    constructor(address _tokenA, address _tokenB, uint256 _lockPeriod) {
        tokenA = IERC20(_tokenA);
        tokenB = IMintableBurnableERC20(_tokenB);
        lockPeriod = _lockPeriod;
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(tokenA.transferFrom(msg.sender, address(this), amount), "TokenA transfer failed");

        Stake storage userStake = stakes[msg.sender];
        userStake.amount += amount;
        userStake.unlockTime = block.timestamp + lockPeriod;

        tokenB.mint(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        Stake storage userStake = stakes[msg.sender];
        require(block.timestamp >= userStake.unlockTime, "Still locked");
        require(userStake.amount >= amount, "Not enough staked");

        userStake.amount -= amount;
        tokenB.burnFrom(msg.sender, amount);
        require(tokenA.transfer(msg.sender, amount), "TokenA transfer failed");
    }

    function getStakeInfo(address user) external view returns (uint256 amount, uint256 unlockTime) {
        Stake memory stakeInfo = stakes[user];
        return (stakeInfo.amount, stakeInfo.unlockTime);
    }
}
