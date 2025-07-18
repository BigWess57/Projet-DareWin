import { act, useContext, useEffect, useState } from "react";

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { Abi, Address, isAddressEqual, parseAbi, parseAbiItem } from "viem"
import { useAccount, useReadContract, useReadContracts, useSimulateContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi"

import { contractAbi, fromBlock } from "@/constants/ChallengeInfo"
import { tokenAddress, tokenAbi} from "@/constants/TokenInfo"

import { publicClient } from '@/utils/client';

import { BidContext } from "../RouteBaseElements/ChallengePage";
import { ReadContractErrorType, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { config } from "@/app/RainbowKitAndWagmiProvider";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { ContractAddressContext } from "../RouteBaseElements/ChallengePage";
import Joined from "../Miscellaneous/Joined";


const JoiningChallenge = ({refetchStatus} : {refetchStatus: (options?: RefetchOptions) => Promise<QueryObserverResult<unknown, ReadContractErrorType>>}) => {

    const bid = useContext(BidContext)
    const contractAddress = useContext(ContractAddressContext)

    const {address} = useAccount()

    const [userHasJoined, setUserHasJoined] = useState<boolean>(false)

    /***************** 
 * Functions for interaction with the blokchain 
 * **************/

    // const { data: allowance, error: errorAllowance, isPending: IsPendingAllowance, refetch: refetchAllowance } = useReadContract({
    //     address: tokenAddress,
    //     abi: tokenAbi,
    //     functionName: 'allowance',
    //     args: [address, contractAddress],
    //     account: address as `0x${string}` | undefined
    // })

    // const { data: challengeOwner, error: errorOwner, isPending: IsPendingOwner, refetch: refetchOwner } = useReadContract({
    //     address: contractAddress,
    //     abi: contractAbi,
    //     functionName: 'owner',
    //     account: address as `0x${string}` | undefined
    // })
    const { data: readData, error: error, isPending: IsPending, refetch: refetch } = useReadContracts({
        contracts: [
            {
                address: tokenAddress,
                abi: tokenAbi,
                functionName: 'allowance',
                args: [address, contractAddress],
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'owner',
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'groupMode',
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'isAllowed',
                args: [address as Address],
            },
        ],
        account: address as `0x${string}` | undefined
      })


    const [allowance, setAllowance] = useState<bigint>(0n)
    const [challengeOwner, setChallengeOwner] = useState<Address>("0x0000000000000000000000000000000000000000")
    const [groupMode, setGroupMode] = useState<boolean>(false)
    const [isAllowed, setIsAllowed] = useState<boolean>(false)

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
        getEvents()
        refetchStatus()
        refetch()
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
        if (!readData) return

        // allowance
        const a = readData[0].result
        setAllowance(a as bigint)

        // owner
        const owner = readData[1].result
        setChallengeOwner(owner as Address)

        // group mode
        const mode = readData[2].result
        setGroupMode(mode as boolean)

        // is player allowed to join
        const allowed = readData[3].result
        setIsAllowed(allowed as boolean)

        refetchAll();
    }, [readData, address])

    // useEffect(() => {
    //     refetchAll();
    // }, [address])

    //For displaying moving dots
    const [dots, setDots] = useState(".");

    useEffect(() => {
        const interval = setInterval(() => {
        setDots((prev) => {
            if (prev === "...") return ".";
            return prev + ".";
        });
        }, 500);

        return () => clearInterval(interval);
    }, []);

/************
 * Display
 *************/
    return (
        // <div>
        //     <div className="flex-between">
        //         <p>🚀 Waiting for players to join...</p>
        //         <div className="flex flex-col items-center">
        //             <div>Mode : <span className="font-bold">{groupMode ? "Friend Group" : "Public"}</span></div>
        //             {groupMode && 
        //                 <div className="text-xl">
        //                     {isAllowed ?
        //                         <div>You are allowed to participate in this challenge</div> 
        //                         : <div>You are not allowed to participate in this challenge</div>
        //                     }
        //                 </div>
        //             }
        //         </div>
                
        //         {challengeOwner && address && isAddressEqual(challengeOwner, address) &&
        //             <Button disabled={events.length < 2} onClick={startChallenge}>Start Challenge</Button>
        //         }
                
        //     </div>
        //     <div className="flex gap-2">
        //         {!userHasJoined ? 
        //             <Button disabled={!isAllowed} onClick={joinChallenge}>JOIN</Button> 
        //         :
        //             <Button disabled={!isAllowed} onClick={withdrawFromChallenge}>LEAVE</Button>
        //         }
        //     </div>
        //     <div className="p-10">
        //         <div>Current players :</div>
        //         <div className="mt-4 flex flex-col">
        //             {events?.length > 0 ? [...events].reverse().map((addr) => {
        //                 return (
        //                     <Joined address={addr} key={crypto.randomUUID()} />
        //                 )
        //                 })
        //                 : <div className="italic">(none yet)</div>
        //             }
        //         </div>
        //     </div>

        // </div>
        <div className="space-y-6 p-6 bg-gradient-to-br from-[#1F243A] to-[#151A2A] border border-white/10 rounded-2xl shadow-xl">

            {/* Statut d’attente */}
            <div className="flex items-center justify-between bg-[#0B1126] p-4 rounded-lg border border-cyan-500/20">
                <p className="flex items-center gap-2 text-xl font-semibold text-white/90">
                🚀 En attente de joueurs{dots}
                </p>
                <div className="flex flex-col items-end space-y-1 text-sm">
                <div className="text-white/60">
                    Mode : <span className="font-semibold text-cyan-400">{groupMode ? 'Friend Group' : 'Public'}</span>
                </div>
                {groupMode && (
                    <div className={`text-sm ${isAllowed ? 'text-green-400' : 'text-red-400'}`}>
                    {isAllowed
                        ? 'You are allowed to participate'
                        : 'You are not allowed to participate'}
                    </div>
                )}
                </div>
            </div>

            {/* Header d’état + Actions */}
            <div className="flex items-center justify-between space-x-4">
                {/* Boutons JOIN / LEAVE */}
                {!userHasJoined ? (
                    <button
                    onClick={joinChallenge}
                    disabled={groupMode && !isAllowed}
                    className={`
                        w-1/3 px-4 py-3 rounded-lg font-medium transition
                        ${groupMode && !isAllowed
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:brightness-110'}
                    `}
                    >
                    REJOINDRE
                    </button>
                ) : (
                    <button
                    onClick={withdrawFromChallenge}
                    disabled={groupMode && !isAllowed}
                    className={`
                        w-1/3 px-4 py-3 rounded-lg font-medium transition
                        ${groupMode && !isAllowed
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:brightness-110'}
                    `}
                    >
                    QUITTER
                    </button>
                )}

                {/* Bouton Start Challenge (propriétaire uniquement) */}
                {challengeOwner && address && isAddressEqual(challengeOwner, address) && (
                    <button
                    onClick={startChallenge}
                    disabled={events.length < 2}
                    className={`
                        px-4 py-2 rounded-lg font-semibold transition
                        ${events.length < 2
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:brightness-110'}
                    `}
                    >
                        Démarrer le défi
                    </button>
                )}
            </div>

            {/* Liste des joueurs */}
            <div className="p-4 bg-[#0B1126] rounded-lg border border-white/10">
                <h4 className="text-sm text-white/60 uppercase mb-2">Joueurs :</h4>
                <div className="flex flex-col gap-2 text-white">
                {events?.length > 0 ? (
                    [...events].reverse().map((addr) => (
                        <Joined address={addr} key={addr} />
                    ))
                ) : (
                    <div className="italic text-white/50">(none yet)</div>
                )}
                </div>
            </div>
            </div>
    )
}

export default JoiningChallenge