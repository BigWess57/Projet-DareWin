import { hardhat, sepolia, holesky, baseSepolia, Chain } from "viem/chains";

const SUPPORTED_CHAINS = {
  baseSepolia,
  sepolia,
  holesky,
  hardhat,
} as const;

type ChainKey = keyof typeof SUPPORTED_CHAINS;

const CHAIN_RPC_URLS: Record<ChainKey, string> = {
  baseSepolia: process.env.NEXT_PUBLIC_BASE_SEPOLIA_ALCHEMY_RPC || "",
  sepolia: process.env.NEXT_PUBLIC_SEPOLIA_ALCHEMY_RPC || "",
  holesky: process.env.NEXT_PUBLIC_HOLESKY_ALCHEMY_RPC || "",
  hardhat: "",
};

// Contract addresses for each chain
export const TOKEN_ADDRESSES: Record<ChainKey, `0x${string}`> = {
  baseSepolia: "0xc6D0F551813f93E76c37C45fcAd48271b8EDa1AD",
  sepolia: "0xB32F99D77195738d7dfE0502Bc0EDc6F1158ECD3", 
  holesky: "0x93C1101D99048DFF77844B32081729f39F501903",
  hardhat: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
};

export const FACTORY_ADDRESSES: Record<ChainKey, `0x${string}`> = {
  baseSepolia: "0x7086C28Fa981a489498fA4651A4D3104b92bC788",
  sepolia: "0xc665D2331f7CA33869F5F0EE563c5C5C2554D919",
  holesky: "0x411F9f26C89CFe22a5f952A1995C4250f383A387",
  hardhat: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
};


//subgraph URL for each chain
export const SUBGRAPH_URLS: Record<ChainKey, string> = {
  baseSepolia: "https://api.studio.thegraph.com/query/1704762/challenge-subgraph/v0.0.1",
  sepolia: "",
  holesky: "",
  hardhat: "http://localhost:8000/subgraphs/name/challenge",
};


// Helper function to validate chain key
function isValidChainKey(chain: string): chain is ChainKey {
  return chain in SUPPORTED_CHAINS;
}

// Set default chain here - ONLY CHANGE THIS LINE (OR IN .env.local)
// Get and validate default chain
const envChain = process.env.NEXT_PUBLIC_DEFAULT_CHAIN || "baseSepolia";
export const DEFAULT_CHAIN: ChainKey = isValidChainKey(envChain) 
  ? envChain 
  : "baseSepolia";


export const currentChain: Chain = SUPPORTED_CHAINS[DEFAULT_CHAIN];
export const currentRPC: string = CHAIN_RPC_URLS[DEFAULT_CHAIN];

export const tokenAddress: `0x${string}` = TOKEN_ADDRESSES[DEFAULT_CHAIN];
export const factoryAddress: `0x${string}` = FACTORY_ADDRESSES[DEFAULT_CHAIN];

export const currentSubgraphURL: string = SUBGRAPH_URLS[DEFAULT_CHAIN];

// Optional: Export all chains as array if needed elsewhere
// export const allChains: Chain[] = Object.values(SUPPORTED_CHAINS);