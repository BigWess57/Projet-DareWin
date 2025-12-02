# DareWin Backend – Smart Contracts & Blockchain Magic

This is where all the smart contract logic lives for DareWin. Built with Hardhat and Solidity, this backend handles creating challenges, managing bets, and distributing winnings automatically.

## 📋 Quick Overview

- [⚙️ Setup](#️-setup)
- [🔧 Environment Variables](#-environment-variables)
- [🏃 Running Locally](#-running-locally)
- [🔄 Testing the Swap Interface (Forking Mainnet)](#-testing-the-swap-interface-forking-mainnet)
- [🧪 Running Tests](#-running-tests)
- [🚀 Deployment](#-deployment)
- [🔗 Useful Links](#-useful-links)

## ⚙️ Setup

First, install dependencies:

```bash
npm ci
```

## 🔧 Environment Variables

setup in your .env file (NEVER PUSH IT TO GITHUB!!)
```bash
ETHERSCAN_API_KEY=your_etherscan_api_key_here
MAINNET_RPC_URL=your_mainnet_rpc_url_here
HOLESKY_RPC_URL=your_holesky_rpc_url_here
SEPOLIA_RPC_URL=your_sepolia_rpc_url_here
BASE_SEPOLIA_RPC_URL=your_base_sepolia_rpc_url_here
PRIVATE_KEY=your_private_key_here
```
Where to get these:
- RPC URLs: Use a service like Infura, Alchemy, or Chainstack
- Etherscan API Key: Get it from etherscan.io/apis
- Private Key: Use a test wallet's private key (never use your main wallet!)

## 🏃 Running Locally

### Basic Local Node
```bash
npx hardhat node
```
This spins up a local Ethereum network with 20 test accounts funded with fake ETH.

### Full Local Development Setup (Recommended)
We use a local GraphQL node to index blockchain events for faster querying. The easiest way to set this up:
- **Install Docker** (if you don't have it): [Get Docker here](https://www.docker.com/products/docker-desktop/)
- **Launch Docker** and make sure it's running
- **Run the "Start All" task** from .vscode/tasks.json (this is set up for Linux, adapt for Windows/Mac if needed)
This task automatically:
- starts Local Hardhat node
- Deploys factory and token contracts
- starts Local Graph Node
- deploys a local subgraph
- starts the frontend (npm run dev)
Need help setting up a local Graph Node? Check out this [debugging tutorial](https://docs.chainstack.com/docs/subgraphs-tutorial-debug-subgraphs-with-a-local-graph-node).

## 🔄 Testing the Swap Interface (Forking Mainnet)
To test the Uniswap swap interface locally, you need to fork the Ethereum mainnet:
1.Start a forked node:
```bash
npx hardhat node --fork <MAINNET_RPC_URL>
```
This creates a local copy of mainnet where you can interact with real Uniswap contracts.
2.Deploy token and factory contracts:
```bash
npx hardhat run scripts/deployTokenAndFactory.js --network localhost
```
3.Create the ETH/DARE liquidity pool:
```bash
npx hardhat run scripts/addLiquidityDareEth.js --network localhost
```
Now you have a fully functional DARE/ETH pool on your local fork!
More details on forking: [Hardhat Forking Guide](https://hardhat.org/hardhat-network/docs/guides/forking-other-networks)

## 🧪 Running Tests

```bash
# Run all tests
npx hardhat test

# Run tests coverage
npx hardhat coverage

# Run tests on a specific network
npx hardhat test --network localhost
```

## 🚀 Deployment

```bash
# Deploy to Base Sepolia (our testnet)
npx hardhat run scripts/deployTokenAndFactory.js --network baseSepolia

# Deploy to other networks
npx hardhat run scripts/deployTokenAndFactory.js --network sepolia
npx hardhat run scripts/deployTokenAndFactory.js --network holesky
```
## 🔗 Useful Links

- [Hardhat Documentation](https://hardhat.org/hardhat-runner/docs/getting-started)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [The Graph Documentation](https://thegraph.com/docs/en/)
- [Uniswap V2 Documentation](https://docs.uniswap.org/contracts/v2/overview)

For frontend-specific issues, check out the [frontend README](https://github.com/BigWess57/Projet-DareWin/tree/main/frontend)


Test + coverage Results:
See test-report/:
- report.html → report readable on a webpage
- report.json → raw Json data
