// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Challenge.sol";
import "./DareWinTokenERC20.sol";

/// @title ChallengeFactory
/// @notice Factory contract to deploy new `Challenge` instances using the DareWin token
contract ChallengeFactory {

    DareWin immutable dareWinToken;
    address immutable feeReceiver;

    /// @notice Emitted when a new `Challenge` is created
    /// @param admin The address that created the challenge
    /// @param challengeAddress The on-chain address of the newly deployed challenge contract
    /// @param blockNumber The block number when the challenge was created
    event ChallengeCreated(address indexed admin, address challengeAddress, uint256 blockNumber);

    /// @notice Initializes the factory with the DareWin token and fee receiver
    /// @param _tokenAddress The address of the DareWin ERC20 token contract
    /// @param _feeReceiver The address designated to receive challenge fees
    constructor(DareWin _tokenAddress, address _feeReceiver) {
        require(_feeReceiver != address(0), "the feeReceiver cannot be address 0!");
        dareWinToken = _tokenAddress;
        feeReceiver = _feeReceiver;
    }
    
    /// @notice Creates a new `Challenge` contract
    /// @param duration Duration of the challenge in seconds
    /// @param maxPlayers Maximum number of participants allowed
    /// @param bid Amount of DareWin tokens required to join
    /// @param description A short textual description of the challenge
    /// @param groupMode Whether the challenge is restricted to a predefined group
    /// @param group List of allowed addresses (used if `groupMode` is `true`)
    function createChallenge(uint64 duration, uint8 maxPlayers, uint128 bid, string memory description, bool groupMode, address[] memory group) external {
        Challenge c = new Challenge(msg.sender, dareWinToken, duration, maxPlayers, bid, description, feeReceiver, groupMode, group);
        emit ChallengeCreated(msg.sender, address(c), block.timestamp);
    }

}