// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./Challenge.sol";
import "./DareWinTokenERC20.sol";

contract ChallengeFactory {

    DareWin dareWinToken;
    address feeReceiver;

    event ChallengeCreated(address indexed admin, address challengeAddress);

    constructor(DareWin _tokenAddress, address _feeReceiver) {
        dareWinToken = _tokenAddress;
        feeReceiver = _feeReceiver;
    }

    function createChallenge(uint duration, uint maxPlayers, uint bid, string memory description, bool _groupMode, address[] memory _group) external {
        Challenge c = new Challenge(dareWinToken, duration, maxPlayers, bid, description, feeReceiver, _groupMode, _group);
        emit ChallengeCreated(msg.sender, address(c));
    }

}