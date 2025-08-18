// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Lottery
 * @notice Educational round-based lottery. NOT secure randomness for production.
 */
contract Lottery is ReentrancyGuard {
    event PlayerJoined(address indexed player, uint256 indexed round, uint256 totalPlayers);
    event WinnerChosen(address indexed winner, uint256 amount, uint256 indexed round);

    uint256 public immutable entryFeeWei;   // e.g., 0.01 ether
    uint256 public immutable maxPlayers;    // e.g., 10

    uint256 public round;                   // current round number
    address[] private players;              // players in current round
    mapping(uint256 => mapping(address => bool)) public hasEntered; // round => (addr => entered)

    constructor(uint256 _entryFeeWei, uint256 _maxPlayers) {
        require(_entryFeeWei > 0, "Entry fee must be > 0");
        require(_maxPlayers > 1, "maxPlayers must be > 1");
        entryFeeWei = _entryFeeWei;
        maxPlayers  = _maxPlayers;
    }

    /// @notice Join the lottery by paying exactly the entry fee.
    function enter() external payable nonReentrant {
        require(msg.value == entryFeeWei, "Incorrect entry fee");
        require(!hasEntered[round][msg.sender], "Already entered this round");
        require(players.length < maxPlayers, "Round is full");

        players.push(msg.sender);
        hasEntered[round][msg.sender] = true;
        emit PlayerJoined(msg.sender, round, players.length);

        if (players.length == maxPlayers) {
            _pickWinnerAndPayout();
        }
    }

    /// @dev internal-only winner selection & payout when threshold reached.
    function _pickWinnerAndPayout() internal {
        // PSEUDO-random for demo: do NOT use in production; prefer Chainlink VRF.
        uint256 rand = uint256(keccak256(abi.encode(block.prevrandao, block.timestamp, players)));
        uint256 idx = rand % players.length;
        address winner = players[idx];
        uint256 prize = address(this).balance;

        // Reset per-round state
        for (uint256 i = 0; i < players.length; i++) {
            delete hasEntered[round][players[i]];
        }
        delete players;

        emit WinnerChosen(winner, prize, round);
        round += 1;

        // Interaction last
        (bool ok,) = winner.call{value: prize}("");
        require(ok, "Payout failed");
    }

    // View helpers
    function getPlayers() external view returns (address[] memory) { return players; }
    function playersCount() external view returns (uint256) { return players.length; }
}
