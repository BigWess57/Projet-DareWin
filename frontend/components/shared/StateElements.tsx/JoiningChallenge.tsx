import { useContext, useEffect, useState } from "react";

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { Abi, Address, parseAbiItem } from "viem"
import { useAccount, useReadContract, useSimulateContract, useWaitForTransactionReceipt, useWriteContract, WagmiConfig } from "wagmi"

import { contractAbi, contractAddress, fromBlock } from "@/constants/ChallengeInfo"
import { tokenAddress, tokenAbi} from "@/constants/TokenInfo"
import Event from "../Miscellaneous/Event";

import { publicClient } from '@/utils/client';

import CurrentTransaction from "../Miscellaneous/CurrentTransaction";
import { BidContext } from "../Challenge";
import { ReadContractErrorType, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { config } from "@/app/RainbowKitAndWagmiProvider";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";


const JoiningChallenge = ({refetchStatus} : {refetchStatus: (options?: RefetchOptions) => Promise<QueryObserverResult<unknown, ReadContractErrorType>>}) => {

    const bid = useContext(BidContext)

    const {address} = useAccount()


    /***************** 
 * Functions for interaction with the blokchain 
 * **************/

    const { data: allowance, error: error, isPending: IsPending, refetch: refetchAllowance } = useReadContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'allowance',
        args: [address, contractAddress],
        account: address as `0x${string}` | undefined
    })

    const { data: challengeOwner, error: errorOwner, isPending: IsPendingOwner, refetch: refetchOwner } = useReadContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'owner',
        account: address as `0x${string}` | undefined
    })

    //Events
    const [events, setEvents] = useState<(Address | undefined)[]>([]);
  
    const getEvents = async() => {

        const Logs = await publicClient.getLogs({
            address: contractAddress,
            event: parseAbiItem("event PlayerJoined(address player)"),
            // du premier bloc
            fromBlock: BigInt(fromBlock),
            // jusqu'au dernier
            toBlock: 'latest' // Pas besoin valeur par défaut
        })
        console.log(Logs)

        setEvents(Logs.map(
            log => (log.args.player)
        ))
    }


    const refetchAll = async () => {
        refetchAllowance()
        getEvents()
        refetchStatus()
        refetchOwner()
    }

    const joinChallenge = async () => {

        try{
            //Check if allowance has already been set
            if(allowance as bigint < bid){
                //Approve the use of needed amount of tokens
                const approveHash = await writeContract(config, {
                    address: tokenAddress,
                    abi: tokenAbi,
                    functionName: 'approve',
                    args: [contractAddress, bid],
                    account: address as `0x${string}`,
                })
                //Wait for approval of transaction
                await waitForTransactionReceipt(config, { hash: approveHash, confirmations: 1  })
            }

            //Ask user to joinChallenge
            const joinHash = await writeContract(config, {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'joinChallenge',
                account: address as `0x${string}`,
            })
            await waitForTransactionReceipt(config, { hash: joinHash, confirmations: 1 })

            console.log('✅ Joined successfully!')
            toast.success("Success", {
                description: "You successfully joined the challenge!",
            })
            await refetchAll();
        } catch (err) {
            console.error('Transaction failed ', err)
            toast.error("Error : Could not join challenge", {
                duration: 3000,
                // isClosable: true,
            });
        }
        
    }


    const startChallenge = async () => {
        try{
            //Ask user to joinChallenge
            const startHash = await writeContract(config, {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'startChallenge',
                account: address as `0x${string}`,
            })
            await waitForTransactionReceipt(config, { hash: startHash, confirmations: 1 })

            console.log('Challenge started successfully!')
            toast.success("Success", {
                description: "Challenge started successfully",
            })
            await refetchAll();
        } catch (err) {
            console.error('Transaction failed ', err)
            toast.error("Error : Could not start the challenge", {
                duration: 3000,
                // isClosable: true,
            });
        }
    }
    

 /********** Use effects *************/

    useEffect(() => {
        refetchAll();
    }, [address])


/************
 * Display
 *************/
    return (
        <div>
            <div className="flex-between">
                <p>🚀 Waiting for players to join...</p>
                {challengeOwner === address &&
                    <Button disabled={events.length < 2} onClick={startChallenge}>Start Challenge</Button>
                }
                
            </div>
            <div className="flex gap-2">
                <Button onClick={joinChallenge}>JOIN</Button>
                {/* <CurrentTransaction hash={hash} isConfirming={isConfirming} isSuccess={isSuccess} errorConfirmation={errorConfirmation} error={error ?? null} /> */}
            </div>
            <div className="p-10">
                <div>Current players :</div>
                <div className="mt-4 flex flex-col">
                    {events?.length > 0 ? [...events].reverse().map((addr) => {
                        return (
                            <Event address={addr} key={crypto.randomUUID()} />
                        )
                    }) : <div className="italic">(none yet)</div>
                    }
                </div>
            </div>

        </div>
    )
}

export default JoiningChallenge