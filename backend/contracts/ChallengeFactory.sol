// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
// import {RegistrationParams, AutomationRegistrarInterface} from "./interfaces/ChainlinkAutomationRegistrarInterface.sol";
// import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";

import "./Challenge.sol";
import "./DareWinTokenERC20.sol";



contract ChallengeFactory {

    DareWin dareWinToken;
    address feeReceiver;

    // LinkTokenInterface public immutable i_link;
    // AutomationRegistrarInterface public immutable i_registrar;
    // uint32 public performGas = 500_000;

    event ChallengeCreated(address indexed admin, address challengeAddress, uint256 blockNumber);

    constructor(DareWin _tokenAddress, address _feeReceiver/*, LinkTokenInterface link, AutomationRegistrarInterface registrar*/) {
        dareWinToken = _tokenAddress;
        feeReceiver = _feeReceiver;

        //Used for chainlink automation
        // i_link = link;
        // i_registrar = registrar;
    }

    

    function createChallenge(uint duration, uint maxPlayers, uint bid, string memory description, bool _groupMode, address[] memory _group) external {
        Challenge c = new Challenge(msg.sender, dareWinToken, duration, maxPlayers, bid, description, feeReceiver, _groupMode, _group);
        emit ChallengeCreated(msg.sender, address(c), block.timestamp);

        // //Now register for chainlink automation
        // _register(c);
    }


    // function _register(Challenge c) public {
    //     // 1. Approve LINK at registrar
    //     uint96 amount = 1e17; // 0.1 LINK
    //     i_link.approve(address(i_registrar), amount);

    //     RegistrationParams memory params = RegistrationParams(
    //         "Challenge end upkeep",    // nom
    //         "",                    // email
    //         address(c),            // contrat upkeep
    //         performGas,
    //         msg.sender,            // admin
    //         0,                     // custom logique
    //         hex"", hex"", hex"",
    //         amount
    //     );

    //     uint256 upkeepId = i_registrar.registerUpkeep(params);
    //     // Tu peux stocker upkeepId si besoin
    // }
}