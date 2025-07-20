// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;


import "./Challenge.sol";
import "./DareWinTokenERC20.sol";



contract ChallengeFactory {

    DareWin immutable dareWinToken;
    address immutable feeReceiver;

    event ChallengeCreated(address indexed admin, address challengeAddress, uint256 blockNumber);

    constructor(DareWin _tokenAddress, address _feeReceiver) {
        require(_feeReceiver != address(0), "the feeReceiver cannot be address 0!");
        dareWinToken = _tokenAddress;
        feeReceiver = _feeReceiver;
    }
    

    function createChallenge(uint duration, uint maxPlayers, uint bid, string memory description, bool groupMode, address[] memory group) external {
        Challenge c = new Challenge(msg.sender, dareWinToken, duration, maxPlayers, bid, description, feeReceiver, groupMode, group);
        emit ChallengeCreated(msg.sender, address(c), block.timestamp);
    }

}