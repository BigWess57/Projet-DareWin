# DareWin – Web3 Challenge Platform for Friends
[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.28-363636?style=flat&logo=solidity)](https://docs.soliditylang.org/)
[![React](https://img.shields.io/badge/React-18%2B-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0%2B-06B6D4?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**DareWin** is a decentralized challenge platform built on Ethereum where friends can challenge each other with crypto bets. Think of it as a trustless way to dare your buddies – the smart contracts handle everything, so no one can back out of the payout!

### ⚡ Quick Start – How to Use It

**DareWin is currently live on Base Sepolia testnet!** Here's how to get started:

1. **Get some Base Sepolia ETH** (you'll need this for gas fees and to buy DARE tokens):
   - Visit a Base Sepolia faucet (example : [https://www.basefaucet.org/](https://console.optimism.io/faucet), [https://coinbase.com/faucets/base-sepolia-faucet](https://docs.base.org/base-chain/tools/network-faucets)...)
   - Paste your wallet address and claim free test ETH

2. **Swap ETH for DARE tokens** (you need DARE to join challenges):
   - Go to the home page of the app
   - Use the built-in swap interface to exchange your ETH for DARE tokens
   - These tokens are what you'll use to enter challenges

3. **Join a challenge or create your own**:
   - Browse existing challenges on the platform
   - Or create a custom challenge with your own rules and bet amount

4. **Play and vote**:
   - Complete the challenge requirements
   - At the end, all participants vote to determine the winner
   - The smart contract automatically distributes the pot to the winner!

That's it! No central authority, no disputes – just pure challenge fun on the blockchain.

## 📋 What's Inside

- [🎯 DareWin – Web3 Challenge Platform for Friends](#-darewin--web3-challenge-platform-for-friends)
  - [📋 What's Inside](#-whats-inside)
  - [🌟 What is DareWin?](#-what-is-darewin)
  - [🏗️ Tech Stack Breakdown](#️-tech-stack-breakdown)
    - [Frontend – The User Interface](#frontend--the-user-interface)
    - [Backend – Smart Contracts](#backend--smart-contracts)
  - [⚙️ What You'll Need](#️-what-youll-need)
  - [🚀 Quick Setup](#-quick-setup)
  - [🔗 Useful Links](#-useful-links)
  - [📄 License](#-license)

## 🌟 What is DareWin?

DareWin brings friendship challenges to the blockchain. Here's what you can do:

- **Create custom challenges** with crypto bets attached (with DARE tokens)
- **Join existing challenges** securely through smart contracts
- **Validate challenge completion** in a decentralized way
- **Win automatic payouts** – no middleman, no trust issues!

Every challenge runs on a smart contract that ensures everything's transparent and fair. It's a fun way to show off modern Web3 tech while actually building something useful for you and your friends.


## 🏗️ Tech Stack Breakdown

### /Frontend – The User Interface

Built with modern tools for a smooth Web3 experience:

- **[React 18+](https://react.dev/)** – For building a fast, interactive UI
- **[Tailwind CSS](https://tailwindcss.com/)** – Utility-first CSS for quick styling without the headache
- **[Wagmi](https://wagmi.sh/)** – React hooks that make blockchain integration way easier
- **[Viem](https://viem.sh/)** – Modern Ethereum client that's lightweight and powerful
- **[RainbowKit](https://www.rainbowkit.com/)** – Nice wallet connection UI (works with MetaMask, Coinbase Wallet, Rabby wallet, etc.)

This stack gives you seamless wallet connections, smooth blockchain interactions, and a great user experience for all the Web3 features.

### /Backend – Smart Contracts

The decentralized brain of the operation:

- **[Hardhat](https://hardhat.org/)** – Ethereum dev environment for compiling, testing, and deploying contracts
- **[Solidity](https://docs.soliditylang.org/)** – The programming language for smart contracts written on the EVM
- **[OpenZeppelin](https://www.openzeppelin.com/)** – Battle-tested, secure smart contract libraries
- **[Ethers.js](https://ethers.org/)** – Library for talking to Ethereum (built into Hardhat)

The contracts handle creating challenges, managing bets, participant validation, and automatic reward distribution.

## ⚙️ What You'll Need

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Git](https://git-scm.com/)
- An Ethereum wallet (Rabby or MetaMask work great)
- An Ethereum node provider (Infura, Alchemy...) for mainnet/testnet interaction

## 🚀 Quick Setup

Clone the repo and install dependencies for both parts:

```bash
git clone https://github.com/BigWess57/Projet-DareWin.git
cd Projet-DareWin
```
```bash
# Install frontend dependencies
cd frontend
npm ci
cd ..
```
```bash
# Install backend dependencies
cd backend
npm ci
cd ..
```
For detailed usage instructions, check out the specific READMEs:
- [Frontend README](https://github.com/BigWess57/Projet-DareWin/tree/main/frontend)
- [Backend README](https://github.com/BigWess57/Projet-DareWin/tree/main/backend)

## 🔗 Useful Links
- [Hardhat Docs](https://v2.hardhat.org/hardhat-runner/docs/getting-started)
- [Solidity Docs](https://docs.soliditylang.org)
- [Wagmi Docs](https://v2.hardhat.org/hardhat-runner/docs/getting-started)
- [Viem Docs](https://v2.hardhat.org/hardhat-runner/docs/getting-started)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethereum Dev Resources](https://ethereum.org/developers/)

## 📄 License
MIT License – see the LICENSE file for details.
