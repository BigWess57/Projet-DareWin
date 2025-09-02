import { createConfig } from 'wagmi';
import { AbiEvent, Address, createPublicClient, GetLogsReturnType, http, parseAbi, parseAbiItem } from "viem";
import { hardhat, sepolia, holesky } from "viem/chains";
export const SepoliaRPC = process.env.NEXT_PUBLIC_SEPOLIA_ALCHEMY_RPC || "";
export const HoleskyRPC = process.env.NEXT_PUBLIC_HOLESKY_ALCHEMY_RPC || "";

export const publicClient = createPublicClient({
    chain: holesky,//sepolia, //hardhat
    transport: http(HoleskyRPC),
})

export const wagmiEventRefreshConfig = createConfig({
  syncConnectedChain: true,
  chains: [holesky],//sepolia, //hardhat
  transports: {
    [holesky.id]: http(HoleskyRPC),
  },
});

//function to calculate the latestblock -500
export const retriveEventsFromBlock = async (contractAddress : Address, event1 : string, event2 : string | null = null): Promise<GetLogsReturnType> => {
    const latest = await publicClient.getBlockNumber();
    const MAX_RANGE = 499n;
    let from = latest > 1999n ? latest - 1999n : 0n;
    // let from = BigInt(fromBlock); // bloc de départ
    const allLogs = [];

    while (from <= latest) {
        const to = from + MAX_RANGE >= latest ? latest : from + MAX_RANGE;
        let logs;
        if(event2 == null){
          logs = await publicClient.getLogs({
              address: contractAddress,
              event: parseAbiItem(event1) as AbiEvent,
              fromBlock: from,
              toBlock: to,
          });
        }else{
          logs = await publicClient.getLogs({
              address: contractAddress,
              events: parseAbi([event1, event2]) as AbiEvent[],
              fromBlock: from,
              toBlock: to,
          });
        }
          
        allLogs.push(...logs);
        from = to + 1n;
    }

    return allLogs as GetLogsReturnType;
}