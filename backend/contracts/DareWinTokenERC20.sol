// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

// import "./interfaces/IUniswapV2Router02.sol";
// // Le Router permet d'effectuer des swaps et d'ajouter de la liquidité

// import "./interfaces/IUniswapV2Factory.sol";
// // La Factory crée et gère les paires de tokens

// import "./interfaces/IUniswapV2Pair.sol";
// // Une Pair représente une paire de tokens (ex: DARE/USDC)

contract DareWin is ERC20, ERC20Burnable, Ownable {

    // // Variables d'état privées pour stocker les références aux contrats Uniswap
    // IUniswapV2Router02 private uniswapV2Router02;
    // // Pointeur vers le contrat Router d'Uniswap V2

    // IUniswapV2Factory private uniswapV2Factory;
    // // Pointeur vers le contrat Factory d'Uniswap V2

    // IUniswapV2Pair private uniswapV2Pair;
    // // Pointeur vers la paire de trading créée (BBK/WETH)

    uint256 public MAX_SUPPLY;

    constructor(address initialOwner/*, address _uniswapV2Router02, address _uniswapV2Factory*/) ERC20("DareWin", "DARE") Ownable(initialOwner) {
        _mint(initialOwner, 350000000 * 10 ** decimals());

        // //Max supply 1B
        // MAX_SUPPLY = 1000000000 * 10 ** decimals();

        // // Initialiser les variables avec les adresses des contrats Uniswap
        // uniswapV2Router02 = IUniswapV2Router02(_uniswapV2Router02);
        // // Convertit l'adresse en interface pour pouvoir appeler les fonctions du Router

        // uniswapV2Factory = IUniswapV2Factory(_uniswapV2Factory);
        // // Convertit l'adresse en interface pour pouvoir appeler les fonctions de la Factory

        // // Obtenir l'adresse WETH depuis le router
        // address weth = uniswapV2Router02.WETH();
        // // WETH = Wrapped ETH, c'est la version ERC20 d'Ethereum
        // // Uniswap utilise WETH pour les swaps car ETH n'est pas un token ERC20
        
        // // Créer ou récupérer la paire WETH/BenBKToken
        // address pair = uniswapV2Factory.getPair(address(this), weth);
        // // getPair vérifie si une paire existe déjà entre BBK et WETH
        // // address(this) fait référence à l'adresse de ce contrat (BenBKToken)
        
        // if (pair == address(0)) {
        //     // Si la paire n'existe pas (adresse 0), on la crée
        //     pair = uniswapV2Factory.createPair(address(this), weth);
        //     // createPair crée une nouvelle paire de trading
        // }
        // uniswapV2Pair = IUniswapV2Pair(pair);
        // // Stocke la référence vers la paire créée/récupérée
    }
}