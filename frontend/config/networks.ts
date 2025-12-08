import { hardhat, sepolia, holesky, baseSepolia, Chain } from "viem/chains";

const SUPPORTED_CHAINS = {
  baseSepolia,
  sepolia,
  holesky,
  hardhat,
} as const;

type ChainKey = keyof typeof SUPPORTED_CHAINS;

const CHAIN_RPC_URLS: Record<ChainKey, string> = {
  // baseSepolia: process.env.NEXT_PUBLIC_BASE_SEPOLIA_ALCHEMY_RPC || "",
  baseSepolia: process.env.NEXT_PUBLIC_BASE_SEPOLIA_PUBLIC_RPC || "",
  sepolia: process.env.NEXT_PUBLIC_SEPOLIA_ALCHEMY_RPC || "",
  holesky: process.env.NEXT_PUBLIC_HOLESKY_ALCHEMY_RPC || "",
  hardhat: "",
};

// Important Contract addresses for each chain
const UNISWAP_V2_ROUTER: Record<ChainKey, `0x${string}`> = {
  baseSepolia: "0x1689E7B1F10000AE47eBfE339a4f69dECd19F602",
  sepolia: "0x1234", //Not used currently
  holesky: "0x1234", //Not used currently
  hardhat: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", //Forked local mainnet
};

const UNISWAP_V2_FACTORY: Record<ChainKey, `0x${string}`> = {
  baseSepolia: "0x7Ae58f10f7849cA6F5fB71b7f45CB416c9204b1e",
  sepolia: "0x1234", //Not used currently
  holesky: "0x1234", //Not used currently
  hardhat: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", //Forked local mainnet
};

const WETH_ADDRESS: Record<ChainKey, `0x${string}`> = {
  baseSepolia: "0x4200000000000000000000000000000000000006",
  sepolia: "0x1234", //Not used currently
  holesky: "0x1234", //Not used currently
  hardhat: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", //Forked local mainnet
};

const TOKEN_ADDRESSES: Record<ChainKey, `0x${string}`> = {
  baseSepolia: "0xF5b33B18eF224357aFB475Cbc75cae3084da46FA",
  sepolia: "0xB32F99D77195738d7dfE0502Bc0EDc6F1158ECD3", 
  holesky: "0x93C1101D99048DFF77844B32081729f39F501903",
  hardhat: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // localnet
  // hardhat: "0xd31d3e1F60552ba8B35aA3Bd17c949404fdd12c4", // forked local mainnet
};

const CHALLENGE_FACTORY_ADDRESSES: Record<ChainKey, `0x${string}`> = {
  baseSepolia: "0x0AA78A34a0f93418bBFe502A765740Ab54E5107E",
  sepolia: "0xc665D2331f7CA33869F5F0EE563c5C5C2554D919",
  holesky: "0x411F9f26C89CFe22a5f952A1995C4250f383A387",
  hardhat: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853", // localnet
  // hardhat: "0xd23BF69104cC640E68ebeE83B9833d6Db6F220E6", // forked local mainnet
};


//subgraph URL for each chain
export const SUBGRAPH_URLS: Record<ChainKey, string> = {
  baseSepolia: "https://api.studio.thegraph.com/query/1704762/challenge-subgraph/version/latest",
  sepolia: "",//Not used currently
  holesky: "",//Not used currently
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

export const uniswapV2RouterAddress: `0x${string}` = UNISWAP_V2_ROUTER[DEFAULT_CHAIN];
export const uniswapV2FactoryAddress: `0x${string}` = UNISWAP_V2_FACTORY[DEFAULT_CHAIN];
export const wethAddress: `0x${string}` = WETH_ADDRESS[DEFAULT_CHAIN];
export const tokenAddress: `0x${string}` = TOKEN_ADDRESSES[DEFAULT_CHAIN];
export const factoryAddress: `0x${string}` = CHALLENGE_FACTORY_ADDRESSES[DEFAULT_CHAIN];

export const currentSubgraphURL: string = SUBGRAPH_URLS[DEFAULT_CHAIN];

// Optional: Export all chains as array if needed elsewhere
// export const allChains: Chain[] = Object.values(SUPPORTED_CHAINS);