// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract DareWin is ERC20, ERC20Burnable {

    uint256 public immutable MAX_SUPPLY;

    constructor(address initialOwner) ERC20("DareWin", "DARE") {
        _mint(initialOwner, 1000000000 * 10 ** decimals());

        // //Max supply 1B
        MAX_SUPPLY = 1000000000 * 10 ** decimals();

    }
}