import React, { useEffect, useState } from 'react'

import { factoryAddress } from '@/constants/ChallengeFactoryInfo';
import { retriveEventsFromBlock } from '@/utils/client';

import { Address, formatEther, GetLogsReturnType, isAddressEqual, parseAbi, parseAbiItem } from 'viem';
import { useAccount } from 'wagmi';
import { contractAbi } from '@/constants/ChallengeInfo';
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
    //Get recent challenges and display them
    const [latestChallenges, setLatestChallenges] = useState<(Challenge)[]>([])

//ABI types for events
    const CHALLENGE_CREATED_ABI = parseAbiItem(
        'event ChallengeCreated(address indexed admin, address challengeAddress, uint256 blockNumber)'
    );
    const PLAYER_JOINED_ABI = parseAbiItem(
        'event PlayerJoined(address player)'
    );
    const PLAYER_WITHDRAWN_ABI = parseAbiItem(
        'event PlayerWithdrawn(address player)'
    );
    const EVENT_ABIS = [PLAYER_JOINED_ABI, PLAYER_WITHDRAWN_ABI]




    const retrieveChallenges = async (URL : string) => {
        const res = await fetch(URL);
        if (!res.ok) {
            const errorText = await res.text(); // get the raw response body
            console.error("Failed to fetch challenges:", errorText);
            throw new Error(`Failed to fetch challenges: ${res.status} ${res.statusText}`);
        }
        const { data: Challenges } = await res.json();

        Challenges.forEach((challenge: any) => {
            // console.log(log)
            console.log("Challenge ID:", challenge.id, "by admin:", challenge.admin);
        });
        return Challenges;
    }

    const getChallengeEvents = async() => {

        // const Logs = await retriveEventsFromBlock(factoryAddress, "event ChallengeCreated(address indexed admin, address challengeAddress, uint256 blockNumber)")

        // const Logs : GetLogsReturnType = await retrieveChallengeCreatedEvents(factoryAddress);

        // if (Logs.length === 0) {
        //     console.log("No challenge created have been found")
        //     return;
        // }        

        if(address == undefined){
            return
        }
        
        //FOR CHALLENGES CREATED
        //keep only the addresses of the ones created by current user
        // const challengeCreatedAddresses = (Logs as GetLogsReturnType<typeof CHALLENGE_CREATED_ABI>)
        //     .filter((log) => log.args?.admin && isAddressEqual(log.args?.admin, address))
        //     .map((log) => ({
        //         address: log.args!.challengeAddress as Address,
        //         blockNumber: log.args!.blockNumber as bigint,
        //     }))


        const ChallengesCreated = await retrieveChallenges(`/api/challenges/getChallengesCreated?admin=${address}`);

        const challengeCreatedAddresses = ChallengesCreated.map((challenge: any) => ({
            admin: challenge.admin as Address,
            address: challenge.challengeAddress as Address,
            blockNumber: challenge.blockNumber as bigint,
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
                creator: challenge.admin,
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



        // //FOR CHALLENGES JOINED
        // const challengeJoinedAddresses = (Logs as GetLogsReturnType<typeof CHALLENGE_CREATED_ABI>)
        //     .map((log) => ({
        //         address: log.args!.challengeAddress as Address,
        //         blockNumber: log.args!.blockNumber as bigint,
        //     }))

        // let challengesJoinedInfo: Challenge[] = [];

        // //For each challenge, Retrieve details (duration, bid, maxPlayers, description) and store everything in challenges state variable
        // for(const challenge of challengeJoinedAddresses){
    
        //     const Logs = await retriveEventsFromBlock(challenge.address, "event PlayerJoined(address player)", "event PlayerWithdrawn(address player)") as GetLogsReturnType<typeof EVENT_ABIS[number]>

        //     const playerStates = new Map();
    
        //     for (const log of Logs) {
        //         const player = log.args.player;
        //         if (log.eventName === "PlayerJoined") {
        //             playerStates.set(player, true); // true = currently joined
        //         } else if (log.eventName === "PlayerWithdrawn") {
        //             playerStates.set(player, false); // false = withdrawn
        //         }
        //     }
        //     // Filter players who are still joined (value = true)
        //     const activePlayers = Array.from(playerStates.entries())
        //         .filter(([_, isJoined]) => isJoined)
        //         .map(([player]) => player);


        //     for(const player of activePlayers){
        //         if(player !== address){
        //             continue
        //         }

        //         const result = await readContracts(config, {
        //             contracts: [
        //                 {
        //                     address: challenge.address,
        //                     abi: contractAbi,
        //                     functionName: 'duration',
        //                 },
        //                 {
        //                     address: challenge.address,
        //                     abi: contractAbi,
        //                     functionName: 'bid',
        //                 },
        //                 {
        //                     address: challenge.address,
        //                     abi: contractAbi,
        //                     functionName: 'maxPlayers',
        //                 },
        //                 {
        //                     address: challenge.address,
        //                     abi: contractAbi,
        //                     functionName: 'description',
        //                 },
        //                 {
        //                     address: challenge.address,
        //                     abi: contractAbi,
        //                     functionName: 'groupMode',
        //                 },
        //             ],
        //         })

        //         const [duration, bid, maxPlayers, description, groupMode] = result.map((r) => r.result!)
                
        //         challengesJoinedInfo.push({
        //             creator: address,
        //             contractAddress: challenge.address,
        //             duration: duration as string,
        //             bid: formatEther(bid as bigint),
        //             maxPlayers: maxPlayers as string,
        //             description: description as string,
        //             timestampOfCreation: challenge.blockNumber,
        //             groupMode: groupMode as boolean,
        //         })

        //     }

        // }

        // setChallengesJoined(challengesJoinedInfo)



        ////FOR RECENT CHALLENGES

        const amountToRetrieve = 2;//Hardcoded for now
        const LatestChallenges = await retrieveChallenges(`/api/challenges/getLatestChallenges?number=${amountToRetrieve}`);

        const latestChallengesAddresses = LatestChallenges.map((challenge: any) => ({
            admin: challenge.admin as Address,
            address: challenge.challengeAddress as Address,
            blockNumber: challenge.blockNumber as bigint,
        }))


        let latestChallengesInfo: Challenge[] = [];

        //For each challenge, Retrieve details (duration, bid, maxPlayers, description) and store everything in challenges state variable
        for(const challenge of latestChallengesAddresses){
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
            

            latestChallengesInfo.push({
                creator: challenge.admin,
                contractAddress: challenge.address,
                duration: duration as string,
                bid: formatEther(bid as bigint),
                maxPlayers: maxPlayers as string,
                description: description as string,
                timestampOfCreation: challenge.blockNumber,
                groupMode: groupMode as boolean,
            })
        }

        setLatestChallenges(latestChallengesInfo)


    }
    
    
    function handleChallengeClick(challengeAddress: Address) {
        router.push(`/mychallenges/${challengeAddress}`);
    }


    useEffect(() => {
        getChallengeEvents()
    }, [address])

    return (
        <div className='p-10 flex flex-col gap-10'>

            {/* created */}
            <div>
                <div className='text-2xl font-bold mb-4'>Créés : </div>
                <div>
                    {challengesCreated.length > 0 ? 
                        (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {challengesCreated.map((challenge) => 
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

            {/* joined */}
            <div>
                <div className='text-2xl font-bold mb-4'>Rejoints : </div>
                <div>
                    {challengesjoined.length > 0 ? 
                        (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {challengesjoined.map((challenge) => 
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

            {/* recent */}
            <div>
                <div className='text-2xl font-bold mb-4'>Challenges Récents : </div>
                <div>
                    {latestChallenges.length > 0 ? 
                        (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {latestChallenges.map((challenge) => 
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
                            <div className='text-xl italic'>Aucun challenge trouvé.</div>
                        )
                    }
                </div>
            </div>
            
        </div>
        
    )
}

export default ChallengeList