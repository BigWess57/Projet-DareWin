# DareWin Frontend – React Web3 Interface

The React frontend for DareWin – where users actually interact with the blockchain. Built with modern Web3 tools for a smooth, wallet-connected experience.

## 📋 Quick Overview

- [⚙️ Environment Setup](#️-environment-setup)
- [🔧 Environment Variables](#-environment-variables)
- [🏃 Available Scripts](#-available-scripts)
- [🎮 How It Works](#-how-it-works)
- [📱 Pages Overview](#-pages-overview)
- [🚀 Deployment](#-deployment)
- [🔗 Useful Links](#-useful-links)
- [🔗 Connecting to Backend](#-connecting-to-backend)


## ⚙️ Environment Setup

First, install dependencies:

```bash
npm ci
```
Then create a .env.local file in the frontend/ directory (see variables below).

## 🔧 Environment Variables

```bash
NEXT_PUBLIC_SEPOLIA_ALCHEMY_RPC=your_sepolia_alchemy_rpc_here
NEXT_PUBLIC_HOLESKY_ALCHEMY_RPC=your_holesky_alchemy_rpc_here
NEXT_PUBLIC_BASE_SEPOLIA_ALCHEMY_RPC=your_base_sepolia_alchemy_rpc_here
NEXT_PUBLIC_BASE_SEPOLIA_PUBLIC_RPC=your_base_sepolia_public_rpc_here
PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_DEFAULT_CHAIN=baseSepolia
```
- NEXT_PUBLIC_SEPOLIA_ALCHEMY_RPC: Alchemy RPC URL for Sepolia testnet (used for testing)
- NEXT_PUBLIC_HOLESKY_ALCHEMY_RPC: Alchemy RPC URL for Holesky testnet (used for testing)
- NEXT_PUBLIC_BASE_SEPOLIA_ALCHEMY_RPC: Alchemy RPC URL for Base Sepolia (our main testnet)
- NEXT_PUBLIC_BASE_SEPOLIA_PUBLIC_RPC: Public RPC URL as backup for Base Sepolia
- PINATA_JWT: Your Pinata JWT token for IPFS file pinning
- NEXT_PUBLIC_DEFAULT_CHAIN: The network to use – must be either hardhat (for local development) or baseSepolia (for testnet)

### About Pinata & IPFS
We use Pinata to pin Merkle proof files to IPFS. When someone wants to join a challenge, we need to check if they're on the whitelist – these proofs are stored on IPFS  (at challenge deployment), so we need a Pinata JWT to connect to the service. Get your JWT at [pinata.cloud](https://pinata.cloud/).



## 🏃 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```



## 🎮 How It Works

### Web3 Integration
The frontend interacts with smart contracts using:
- Wagmi Hooks – React hooks for reading from and writing to the blockchain
- Viem – Modern Ethereum client for all blockchain interactions
This combo makes it super easy to connect wallets, read contract data, and send transactions.
### Wallet Connection
We use RainbowKit for wallet connections – it supports MetaMask, Rabby Wallet, WalletConnect, and more. The connection button is in the top right of every page.



## 📱 Pages Overview

### Home Page
- Presentation of the platform
- Built-in swap interface to exchange ETH for DARE tokens
- Connect your wallet and get started
### Create Challenge Form
- Description: What the challenge is about
- Duration: How long the challenge runs
- Mode: Public (anyone can join) or Group (whitelisted addresses only)
- Entry fee: Amount of DARE tokens required to join
- Submit and the smart contract creates your challenge
### Challenge Page
- Join Challenge: Pay the entry fee in DARE tokens to join
- Withdraw: Leave the challenge and get your tokens back (before it starts)
- Vote: Once the challenge ends, all participants vote for the winner
- Withdraw Prize: Winner can claim their prize from the pot



## 🚀 Deployment

### Environment Variables for Production
Make sure your environment variables are set correctly in your production environment:
- Use production RPC URLs (not the free tier ones)
- Ensure NEXT_PUBLIC_DEFAULT_CHAIN is set to baseSepolia (or your desired mainnet)
- Your PINATA_JWT should have proper permissions for pinning
### Deploy to Netlify / Vercel
See [vercel](https://vercel.com) or [netlify](https://www.netlify.com/)



## 🔗 Useful Links
- [Wagmi Documentation](https://wagmi.sh/react/getting-started)
- [Viem Documentation](https://viem.sh/docs/getting-started.html)
- [RainbowKit Documentation](https://www.rainbowkit.com/docs/introduction)
- [Next.js Documentation](https://nextjs.org/docs)
- [Pinata Documentation](https://docs.pinata.cloud/)


## 🔗 Connecting to Backend
The frontend works hand-in-hand with the backend smart contracts. For details on:
- Contract deployment
- Local development setup
- Testing the swap interface
- Running a local GraphQL node

...check out the [backend README](https://github.com/BigWess57/Projet-DareWin/tree/main/backend).
