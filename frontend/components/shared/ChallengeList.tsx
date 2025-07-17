import React, { useEffect, useState } from 'react'

import { factoryAddress } from '@/constants/ChallengeFactoryInfo';
import { publicClient } from '@/utils/client';

import { Address, formatEther, isAddressEqual, parseAbiItem } from 'viem';
import { useAccount } from 'wagmi';
import { contractAbi, fromBlock } from '@/constants/ChallengeInfo';
import { readContracts } from 'wagmi/actions';
import { config } from '@/app/RainbowKitAndWagmiProvider';
import ChallengePreview from './ChallengePreview';
import { useRouter } from 'next/navigation';


export type Challenge = {
    description : string,
    creator : Address,
    contractAddress: Address,
    duration : string,
    bid : string,
    maxPlayers : string,
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
            console.error("No challenge created have been found")
            return;
        }

        if(address == undefined){
            return
        }
        
        //FOR CHALLENGES CREATED
        //keep only the addresses of the ones created by current user
        const challengeCreatedAddresses = Logs
            .filter((log) => log.args?.admin && isAddressEqual(log.args?.admin, address))
            .map((log) => log.args!.challengeAddress as Address)


        let challengesCreatedInfo: Challenge[] = [];

        //For each challenge, Retrieve details (duration, bid, maxPlayers, description) and store everything in challenges state variable
        for(const challengeAddr of challengeCreatedAddresses){
            const result = await readContracts(config, {
                contracts: [
                    {
                        address: challengeAddr,
                        abi: contractAbi,
                        functionName: 'duration',
                    },
                    {
                        address: challengeAddr,
                        abi: contractAbi,
                        functionName: 'bid',
                    },
                    {
                        address: challengeAddr,
                        abi: contractAbi,
                        functionName: 'maxPlayers',
                    },
                    {
                        address: challengeAddr,
                        abi: contractAbi,
                        functionName: 'description',
                    },
                ],
            })

            const [duration, bid, maxPlayers, description] = result.map((r) => r.result!)
            
            challengesCreatedInfo.push({
                creator: address,
                contractAddress: challengeAddr,
                duration: duration as string,
                bid: formatEther(bid as bigint),
                maxPlayers: maxPlayers as string,
                description: description as string,
            })
        }

        setChallengesCreated(challengesCreatedInfo)
        console.log("Stored Created challenges :", challengesCreatedInfo)




        //FOR CHALLENGES JOINED
        const challengeAddresses = Logs
            .map((log) => log.args!.challengeAddress as Address)

        let challengesJoinedInfo: Challenge[] = [];

        //For each challenge, Retrieve details (duration, bid, maxPlayers, description) and store everything in challenges state variable
        for(const challengeAddr of challengeAddresses){

            const joinedEvents = await publicClient.getLogs({
                address: challengeAddr,
                event: parseAbiItem("event PlayerJoined(address player)"),
                fromBlock: BigInt(fromBlock),
                toBlock: 'latest'
            })
            console.log("Players that joined challenge at " + challengeAddr + " :", joinedEvents)

            for(const log of joinedEvents){
                if(log.args?.player !== address){
                    continue
                }

                const result = await readContracts(config, {
                    contracts: [
                        {
                            address: challengeAddr,
                            abi: contractAbi,
                            functionName: 'duration',
                        },
                        {
                            address: challengeAddr,
                            abi: contractAbi,
                            functionName: 'bid',
                        },
                        {
                            address: challengeAddr,
                            abi: contractAbi,
                            functionName: 'maxPlayers',
                        },
                        {
                            address: challengeAddr,
                            abi: contractAbi,
                            functionName: 'description',
                        },
                    ],
                })

                const [duration, bid, maxPlayers, description] = result.map((r) => r.result!)
                
                challengesJoinedInfo.push({
                    creator: address,
                    contractAddress: challengeAddr,
                    duration: duration as string,
                    bid: formatEther(bid as bigint),
                    maxPlayers: maxPlayers as string,
                    description: description as string,
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
                <div className='text-2xl mb-4'>Created by me : </div>
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
                            <div className='italic'>No challenges found.</div>
                        )
                    }
                </div>
            </div>
            <div>
                <div className='text-2xl mb-4'>Joined : </div>
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
                            <div className='italic'>No challenges joined.</div>
                        )
                    }
                </div>
            </div>
            
        </div>
        
    )
}

export default ChallengeList