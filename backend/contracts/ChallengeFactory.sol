// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;  

import "./Challenge.sol";
import "./DareWinTokenERC20.sol";

/// @title ChallengeFactory
/// @notice Factory contract to deploy new `Challenge` instances using the DareWin token
contract ChallengeFactory {

    DareWin immutable dareWinToken;
    address immutable feeReceiver;

    address[] public challenges;
    // mapping(address => bool) public isChallenge;
    // mapping(address => uint256) private indexOf;

    /// @notice Emitted when a new `Challenge` is created
    /// @param admin The address that created the challenge
    /// @param challengeAddress The on-chain address of the newly deployed challenge contract
    /// @param timestamp The timestamp when the challenge was created
    event ChallengeCreated(address indexed admin, address challengeAddress, uint256 timestamp);

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
    /// @param merkleRoot merkle root of addresses allowed in group mode
    function createChallenge(uint64 duration, uint8 maxPlayers, uint128 bid, string memory description, bool groupMode, bytes32 merkleRoot, string memory ipfsCid) external {
        address c = address(new Challenge(msg.sender, dareWinToken, duration, maxPlayers, bid, description, feeReceiver, groupMode, merkleRoot, ipfsCid));

        challenges.push(c);
        // isChallenge[c] = true;
        // indexOf[c] = challenges.length;

        emit ChallengeCreated(msg.sender, c, block.timestamp);
    }

    // getter with pagination (avoid returning huge arrays)
    function getChallenges(uint256 start, uint256 count) external view returns (address[] memory out) {
        uint256 total = challenges.length;
        if (start >= total) return new address[](0);

        uint256 end = start + count;
        if (end > total) {
            end = total;
        }
        uint256 len = end - start;
        out = new address[](len);
        for (uint256 i = 0; i < len; ++i) {
            out[i] = challenges[start + i];
        }
    }

}