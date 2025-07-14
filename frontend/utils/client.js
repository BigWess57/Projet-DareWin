import { createPublicClient, http } from "viem";
import { hardhat, sepolia } from "viem/chains";

const RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC || "";

export const publicClient = createPublicClient({
    // chain: sepolia,
    chain: hardhat,
    transport: http(/*RPC*/),
})