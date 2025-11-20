// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;  

import "./Challenge.sol";
import "./DareWinTokenERC20.sol";

/// @title ChallengeFactory
/// @notice Factory contract to deploy new `Challenge` instances using the DareWin token
contract ChallengeFactory {

    // Custom Errors
    error ZeroAddressFeeReceiver();
    error ZeroAddressToken();
    error InvalidDuration();
    error InsufficientPlayers();
    error InsufficientBid();
    error ChallengeDeploymentFailed();

    DareWin immutable internal dareWinToken;
    address immutable feeReceiver;

    // In case Onchain validation needed
    mapping(address => bool) public isChallenge;
    // For stats
    uint256 public totalChallengesCreated;

    /// @notice Emitted when a new `Challenge` is created
    /// @param admin The address that created the challenge
    /// @param challengeAddress The on-chain address of the newly deployed challenge contract
    /// @param timestamp The timestamp when the challenge was created
    event ChallengeCreated(address indexed admin, address challengeAddress, uint256 timestamp);

    /// @notice Initializes the factory with the DareWin token and fee receiver
    /// @param _tokenAddress The address of the DareWin ERC20 token contract
    /// @param _feeReceiver The address designated to receive challenge fees
    constructor(DareWin _tokenAddress, address _feeReceiver) {
        require(_feeReceiver != address(0), ZeroAddressFeeReceiver());
        require(address(_tokenAddress) != address(0), ZeroAddressToken());
        dareWinToken = _tokenAddress;
        feeReceiver = _feeReceiver;
    }
    
    /// @notice Creates a new `Challenge` contract
    /// @param duration Duration of the challenge in seconds
    /// @param maxPlayers Maximum number of participants allowed
    /// @param bid Amount of DareWin tokens required to join
    /// @param description A short textual description of the challenge
    /// @param groupMode Whether the challenge is restricted to a predefined group
    /// @param merkleRoot merkle root of addresses allowed in group mode
    function createChallenge(uint64 duration, uint32 maxPlayers, uint128 bid, string memory description, bool groupMode, bytes32 merkleRoot, string memory ipfsCid) external {
        require(duration > 0, InvalidDuration());
        require(maxPlayers >= 2, InsufficientPlayers());
        require(bid > 0, InsufficientBid());
        address c = address(new Challenge(msg.sender, dareWinToken, duration, maxPlayers, bid, description, feeReceiver, groupMode, merkleRoot, ipfsCid));

        totalChallengesCreated++;
        isChallenge[c] = true;

        emit ChallengeCreated(msg.sender, c, block.timestamp);
    }
}