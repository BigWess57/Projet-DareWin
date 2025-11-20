// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../ChallengeFactory.sol";

/// @notice Testable wrapper that exposes internal variables
contract ChallengeFactoryTestable is ChallengeFactory {
    
    constructor(DareWin _tokenAddress, address _feeReceiver) 
        ChallengeFactory(_tokenAddress, _feeReceiver) 
    {}
    
    // Expose the internal immutable variable
    function getDareWinToken() public view returns (DareWin) {
        return dareWinToken;
    }
    
    // Expose the fee receiver too
    function getFeeReceiver() public view returns (address) {
        return feeReceiver;
    }
}