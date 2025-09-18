// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract DareWinNew is ERC20, ERC20Burnable, ERC20Permit {

    uint256 public immutable MAX_SUPPLY;

    constructor(address initialOwner) ERC20("DareWinNew", "DARE") ERC20Permit("DareWinNew") {
        _mint(initialOwner, 1000000000 * 10 ** decimals());

        // //Max supply 1B
        MAX_SUPPLY = 1000000000 * 10 ** decimals();

    }
}