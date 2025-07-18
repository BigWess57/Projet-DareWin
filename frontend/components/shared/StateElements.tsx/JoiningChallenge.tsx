import { act, useContext, useEffect, useState } from "react";

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { Abi, Address, isAddressEqual, parseAbi, parseAbiItem } from "viem"
import { useAccount, useReadContract, useSimulateContract, useWaitForTransactionReceipt, useWriteContract, WagmiConfig } from "wagmi"

import { contractAbi, fromBlock } from "@/constants/ChallengeInfo"
import { tokenAddress, tokenAbi} from "@/constants/TokenInfo"

import { publicClient } from '@/utils/client';

import CurrentTransaction from "../Miscellaneous/CurrentTransaction";
import { BidContext } from "../Challenge";
import { ReadContractErrorType, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { config } from "@/app/RainbowKitAndWagmiProvider";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { ContractAddressContext } from "../ChallengePage";
import Joined from "../Miscellaneous/Joined";


const JoiningChallenge = ({refetchStatus} : {refetchStatus: (options?: RefetchOptions) => Promise<QueryObserverResult<unknown, ReadContractErrorType>>}) => {

    const bid = useContext(BidContext)
    const contractAddress = useContext(ContractAddressContext)

    const {address} = useAccount()

    const [userHasJoined, setUserHasJoined] = useState<boolean>(false)

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

    // type Event = {
    //     eventType : string,
    //     playerAddress : Number
    // }

    //Events
    const [events, setEvents] = useState<(Address | undefined)[]>([]);
  
    const getEvents = async() => {

        const Logs = await publicClient.getLogs({
            address: contractAddress,
            events: parseAbi([
                "event PlayerJoined(address player)",
                "event PlayerWithdrawn(address player)",
            ]),
            fromBlock: BigInt(fromBlock),
            toBlock: 'latest'
        })
        // console.log("Player joined/Withdrawn events :",Logs)

        const playerStates = new Map();

        for (const log of Logs) {
            const player = log.args.player;
            if (log.eventName === "PlayerJoined") {
                playerStates.set(player, true); // true = currently joined
            } else if (log.eventName === "PlayerWithdrawn") {
                playerStates.set(player, false); // false = withdrawn
            }
        }
        // Filter players who are still joined (value = true)
        const activePlayers = Array.from(playerStates.entries())
            .filter(([_, isJoined]) => isJoined)
            .map(([player]) => player);

        // console.log("🟢 Active players in challenge:", activePlayers);

        setEvents(activePlayers)

        //Check if the current user has joined
        for(const player of activePlayers){
            if(address === player){
                setUserHasJoined(true)
                return
            }
        }
        setUserHasJoined(false)
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
            refetchAll();
        } catch (err) {
            console.error('Transaction failed ', err)
            toast.error("Error : Could not join challenge", {
                duration: 3000,
                // isClosable: true,
            });
        }
        
    }

    const withdrawFromChallenge = async () => {
        try{
            //Ask user to joinChallenge
            const startHash = await writeContract(config, {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'withdrawFromChallenge',
                account: address as `0x${string}`,
            })
            await waitForTransactionReceipt(config, { hash: startHash, confirmations: 1 })

            console.log('You left the challenge succesfully')
            toast.success("Success", {
                description: "You left the challenge",
            })
            await refetchAll();
        } catch (err) {
            console.error('Transaction failed ', err)
            toast.error("Error : Could not leave the challenge", {
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
                {challengeOwner && address && isAddressEqual(challengeOwner, address) &&
                    <Button disabled={events.length < 2} onClick={startChallenge}>Start Challenge</Button>
                }
                
            </div>
            <div className="flex gap-2">
                {!userHasJoined ? 
                    <Button onClick={joinChallenge}>JOIN</Button> 
                :
                    <Button onClick={withdrawFromChallenge}>LEAVE</Button>
                }
                {/* <CurrentTransaction hash={hash} isConfirming={isConfirming} isSuccess={isSuccess} errorConfirmation={errorConfirmation} error={error ?? null} /> */}
            </div>
            <div className="p-10">
                <div>Current players :</div>
                <div className="mt-4 flex flex-col">
                    {events?.length > 0 ? [...events].reverse().map((addr) => {
                        return (
                            <Joined address={addr} key={crypto.randomUUID()} />
                        )
                    }) : <div className="italic">(none yet)</div>
                    }
                </div>
            </div>

        </div>
    )
}

export default JoiningChallenge