import React, { useEffect, useState } from 'react'

import { factoryAddress } from '@/constants/ChallengeFactoryInfo';
import { publicClient } from '@/utils/client';

import { Address, formatEther, isAddressEqual, parseAbi, parseAbiItem } from 'viem';
import { useAccount } from 'wagmi';
import { contractAbi, fromBlock } from '@/constants/ChallengeInfo';
import { readContracts } from 'wagmi/actions';
import { config } from '@/app/RainbowKitAndWagmiProvider';
import ChallengePreview from '../ChallengePreview';
import { useRouter } from 'next/navigation';


export type Challenge = {
    description : string,
    creator : Address,
    contractAddress: Address,
    duration : string,
    bid : string,
    maxPlayers : string,
    timestampOfCreation : bigint
    groupMode: boolean
}

const ChallengeList = () => {

    const {address} = useAccount()

    const router = useRouter()

    //Get challenges created and display them
    const [challengesCreated, setChallengesCreated] = useState<(Challenge)[]>([])
    //Get challenges joined and display them
    const [challengesjoined, setChallengesJoined] = useState<(Challenge)[]>([])

    const getChallengeEvents = async() => {

        const Logs = await publicClient.getLogs({
            address: factoryAddress,
            event: parseAbiItem("event ChallengeCreated(address indexed admin, address challengeAddress, uint256 blockNumber)"),
            fromBlock: BigInt(fromBlock),
            toBlock: 'latest'
        })
        console.log("Challenge creation events :", Logs)
        if (Logs.length === 0) {
            console.log("No challenge created have been found")
            return;
        }

        if(address == undefined){
            return
        }
        
        //FOR CHALLENGES CREATED
        //keep only the addresses of the ones created by current user
        const challengeCreatedAddresses = Logs
            .filter((log) => log.args?.admin && isAddressEqual(log.args?.admin, address))
            .map((log) => ({
                address: log.args!.challengeAddress as Address,
                blockNumber: log.args!.blockNumber as bigint,
            }))


        let challengesCreatedInfo: Challenge[] = [];

        //For each challenge, Retrieve details (duration, bid, maxPlayers, description) and store everything in challenges state variable
        for(const challenge of challengeCreatedAddresses){
            const result = await readContracts(config, {
                contracts: [
                    {
                        address: challenge.address,
                        abi: contractAbi,
                        functionName: 'duration',
                    },
                    {
                        address: challenge.address,
                        abi: contractAbi,
                        functionName: 'bid',
                    },
                    {
                        address: challenge.address,
                        abi: contractAbi,
                        functionName: 'maxPlayers',
                    },
                    {
                        address: challenge.address,
                        abi: contractAbi,
                        functionName: 'description',
                    },
                    {
                        address: challenge.address,
                        abi: contractAbi,
                        functionName: 'groupMode',
                    },
                ],
            })

            const [duration, bid, maxPlayers, description, groupMode] = result.map((r) => r.result!)
            

            challengesCreatedInfo.push({
                creator: address,
                contractAddress: challenge.address,
                duration: duration as string,
                bid: formatEther(bid as bigint),
                maxPlayers: maxPlayers as string,
                description: description as string,
                timestampOfCreation: challenge.blockNumber,
                groupMode: groupMode as boolean,
            })
        }

        setChallengesCreated(challengesCreatedInfo)
        console.log("Stored Created challenges :", challengesCreatedInfo)




        //FOR CHALLENGES JOINED
        const challengeJoinedAddresses = Logs
            .map((log) => ({
                address: log.args!.challengeAddress as Address,
                blockNumber: log.args!.blockNumber as bigint,
            }))

        let challengesJoinedInfo: Challenge[] = [];

        //For each challenge, Retrieve details (duration, bid, maxPlayers, description) and store everything in challenges state variable
        for(const challenge of challengeJoinedAddresses){
            
            const Logs = await publicClient.getLogs({
                address: challenge.address,
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


            for(const player of activePlayers){
                if(player !== address){
                    continue
                }

                const result = await readContracts(config, {
                    contracts: [
                        {
                            address: challenge.address,
                            abi: contractAbi,
                            functionName: 'duration',
                        },
                        {
                            address: challenge.address,
                            abi: contractAbi,
                            functionName: 'bid',
                        },
                        {
                            address: challenge.address,
                            abi: contractAbi,
                            functionName: 'maxPlayers',
                        },
                        {
                            address: challenge.address,
                            abi: contractAbi,
                            functionName: 'description',
                        },
                        {
                            address: challenge.address,
                            abi: contractAbi,
                            functionName: 'groupMode',
                        },
                    ],
                })

                const [duration, bid, maxPlayers, description, groupMode] = result.map((r) => r.result!)
                
                challengesJoinedInfo.push({
                    creator: address,
                    contractAddress: challenge.address,
                    duration: duration as string,
                    bid: formatEther(bid as bigint),
                    maxPlayers: maxPlayers as string,
                    description: description as string,
                    timestampOfCreation: challenge.blockNumber,
                    groupMode: groupMode as boolean,
                })

            }

        }

        setChallengesJoined(challengesJoinedInfo)
        console.log("Stored Joined challenges :", challengesJoinedInfo)
    }
    
    
    function handleChallengeClick(challengeAddress: Address) {
        router.push(`/mychallenges/${challengeAddress}`);
        console.log("Clicked challenge:", challengeAddress);
    }


    useEffect(() => {
        getChallengeEvents()
    }, [address])

    return (
        <div className='p-10'>
            <div className='mb-10'>
                <div className='text-2xl font-bold mb-4'>Créés : </div>
                <div>
                    {challengesCreated.length > 0 ? 
                        (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {challengesCreated.map((challenge) => 
                                // <div key={crypto.randomUUID()}>{challenge.contractAddress.toString()}</div>
                                <div 
                                    key={challenge.contractAddress}
                                    className='transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer'
                                    onClick={() => handleChallengeClick(challenge.contractAddress)}
                                >
                                    <ChallengePreview challenge={challenge} />
                                </div>
                            )}
                        </div>
                        ) : (
                            <div className='text-xl italic'>Aucun challenge créé.</div>
                        )
                    }
                </div>
            </div>
            <div>
                <div className='text-2xl font-bold mb-4'>Rejoints : </div>
                <div>
                    {challengesjoined.length > 0 ? 
                        (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {challengesjoined.map((challenge) => 
                                // <div key={crypto.randomUUID()}>{challenge.contractAddress.toString()}</div>
                                <div 
                                    key={challenge.contractAddress}
                                    className='transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer'
                                    onClick={() => handleChallengeClick(challenge.contractAddress)}
                                >
                                    <ChallengePreview challenge={challenge} />
                                </div>
                                
                            )}
                        </div>
                        ) : (
                            <div className='text-xl italic'>Aucun challenge rejoint.</div>
                        )
                    }
                </div>
            </div>
            
        </div>
        
    )
}

export default ChallengeList