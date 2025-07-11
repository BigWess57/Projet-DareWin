
require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");

const ALCHEMY_MAINNET_RPC = process.env.ALCHEMY_MAINNET || ''

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    // compilers: [
    //   {
    //     version: "0.8.28",
    //     settings: {
    //       optimizer: { enabled: true, runs: 200 },
    //       evmVersion: "paris"   // IMPORTANT : évite le PUSH0
    //     }
    //   }
    // ]
  },
  gasReporter: {
    enabled: false
  },
  // defaultNetwork: "hardhat",
  // networks: {
  //   hardhat: {
  //     forking: {
  //       enabled: true,
  //       url: ALCHEMY_MAINNET_RPC,
  //       blockNumber: 22889343
  //     }
  //   }
  // }

};
