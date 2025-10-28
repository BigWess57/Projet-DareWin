import { createConfig } from 'wagmi';
import { AbiEvent, Address, createPublicClient, GetLogsReturnType, http, parseAbi, parseAbiItem } from "viem";

import { currentChain, currentRPC } from '../config/networks';

export const publicClient = createPublicClient({
  chain: currentChain,
  transport: http(currentRPC),
});

export const wagmiEventRefreshConfig = createConfig({
  syncConnectedChain: true,
  chains: [currentChain],
  transports: {
    [currentChain.id]: http(currentRPC),
  },
});



// function to calculate the latestblock -500
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