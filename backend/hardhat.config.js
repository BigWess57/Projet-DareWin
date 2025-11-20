
require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const HOLESKY_RPC_URL = process.env.HOLESKY_RPC_URL || "";
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || "";

const PRIVATE_KEY = process.env.PRIVATE_KEY || "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    // version: "0.8.28",
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: { enabled: true, runs: 200 },
    //       evmVersion: "paris"   // IMPORTANT : évite le PUSH0
        }
      }
    ]
  },
  gasReporter: {
    enabled: true
  },
  mocha: {
    reporter: "mochawesome",
    reporterOptions: {
      reportDir: "test-report",
      reportFilename: "report",
      quiet: true
    }
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 11155111,
    },
    holesky: {
      url: HOLESKY_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 17000,
    },
    base: {
      url: BASE_SEPOLIA_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 84532,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
  // /!\  Permet de configurer la vérifications sur Etherscan
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
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
