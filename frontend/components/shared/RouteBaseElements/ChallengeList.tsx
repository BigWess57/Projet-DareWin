import React, { useEffect, useState } from 'react'

import { Address, formatEther, GetLogsReturnType, isAddressEqual, parseAbiItem } from 'viem';
import { useAccount } from 'wagmi';
import { contractAbi } from '@/constants/ChallengeInfo';
import { readContract, readContracts } from 'wagmi/actions';
import { config } from '@/app/RainbowKitAndWagmiProvider';
import { useRouter } from 'next/navigation';
import { retrieveChallenges } from '@/utils/apiFunctions';
import { ChallengeTabs } from '../Miscellaneous/ChallengeTabs';
import { retriveEventsFromBlock } from '@/utils/client';
import { factoryAddress } from '@/config/networks';


export type Challenge = {
    description : string,
    creator : Address,
    contractAddress: Address,
    duration : string,
    bid : string,
    maxPlayers : string,
    timestampOfCreation : string
    groupMode: boolean
}

type ChallengeCreated = {
    id: string
    admin: Address
    challengeAddress: Address
    timestamp: string
    txHash: string
    createdAt: string
}

type ChallengeAddresses = {
    admin: Address,
    address: Address,
    timestamp: string,
}

const ChallengeList = () => {

    const {address} = useAccount()

    const router = useRouter()

    //Get challenges created and display them
    const [challengesCreated, setChallengesCreated] = useState<(Challenge)[]>([])
    //Get challenges joined and display them
    const [challengesJoined, setChallengesJoined] = useState<(Challenge)[]>([])
    //Get recent challenges and display them
    const [latestChallenges, setLatestChallenges] = useState<(Challenge)[]>([])

    const [loadingChallenges, setLoadingChallenges] = useState<(boolean)>(false)

    //ABI types for events
    const CHALLENGE_CREATED_ABI = parseAbiItem(
        'event ChallengeCreated(address indexed admin, address challengeAddress, uint256 timestamp)'
    );
    const PLAYER_JOINED_ABI = parseAbiItem(
        'event PlayerJoined(address player)'
    );
    const PLAYER_WITHDRAWN_ABI = parseAbiItem(
        'event PlayerWithdrawn(address player)'
    );
    const EVENT_ABIS = [PLAYER_JOINED_ABI, PLAYER_WITHDRAWN_ABI]


    //Builds challenges object, for displaying
    const buildChallengesObject = async (challengeAddresses : ChallengeAddresses[]) => {

        let challengesInfo: Challenge[] = [];

        //For each challenge, Retrieve details (duration, bid, maxPlayers, description) and store everything in challenges state variable
        for(const challenge of challengeAddresses){
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
            

            challengesInfo.push({
                creator: challenge.admin,
                contractAddress: challenge.address,
                duration: duration as string,
                bid: formatEther(bid as bigint),
                maxPlayers: maxPlayers as string,
                description: description as string,
                timestampOfCreation: challenge.timestamp,
                groupMode: groupMode as boolean,
            })
        }

        return challengesInfo;
    }


    // Helper function to merge arrays and remove duplicates by challenge address (for RPC retrieved challenges)
    function mergeUniqueChallenges(
        existing: ChallengeAddresses[],
        newChallenges: ChallengeAddresses[]
    ): ChallengeAddresses[] {
        const map = new Map(existing.map(challenge => [challenge.address.toLowerCase(), challenge]));
        
        // Add new challenges only if not already present
        newChallenges.forEach(challenge => {
            const key = challenge.address.toLowerCase();
            if (!map.has(key)) {
                map.set(key, challenge);
            }
        });
        
        return Array.from(map.values());
    }


    const getChallengeEvents = async() => {     

        if(address == undefined){
            return
        }

        setLoadingChallenges(true);

    //FOR CHALLENGES CREATED by current user
        const ChallengesCreated: ChallengeCreated[] = await retrieveChallenges(`/api/challengeFactory/getChallengesCreated?admin=${address}`);

        const challengeCreatedAddresses = ChallengesCreated.map((challenge: ChallengeCreated) => ({
            admin: challenge.admin as Address,
            address: challenge.challengeAddress as Address,
            timestamp: challenge.timestamp as string,
        }))

        
        



    //FOR CHALLENGES JOINED by current user

        //Get All challenges
        const AllChallenges: ChallengeCreated[] = await retrieveChallenges(`/api/challengeFactory/getAllChallenges`);


        const results = await Promise.all(
            AllChallenges.map(async (challenge) => {
                const player = await readContract(config, {
                    address: challenge.challengeAddress as Address,
                    abi: contractAbi,
                    functionName: 'players',
                    args: [address as Address],
                });

                const hasJoined = player[0];
                if (hasJoined) {
                    // return a simplified object
                    return {
                        admin: challenge.admin as Address,
                        address: challenge.challengeAddress as Address,
                        timestamp: challenge.timestamp as string,
                    };
                }

                return null; // user has not joined
            })
        );

        const joinedChallengesAddresses = results.filter((c): c is ChallengeAddresses => c !== null);

        
        



    //FOR RECENT CHALLENGES

        const amountToRetrieve = 100;//Hardcoded for now
        const LatestChallenges: ChallengeCreated[] = await retrieveChallenges(`/api/challengeFactory/getLatestChallenges?number=${amountToRetrieve}`);

        const latestChallengeAddresses = LatestChallenges.map((challenge: ChallengeCreated) => ({
            admin: challenge.admin as Address,
            address: challenge.challengeAddress as Address,
            timestamp: challenge.timestamp as string,
        }))

        
        



        // FOR GETTING RECENT ENTRIES BY RPC (In case TheGraph is slow)
        // Using getLogs() from viem

        // ONLY DO ON TESTNET (not on local hardhat node)
        if(process.env.NEXT_PUBLIC_DEFAULT_CHAIN === "hardhat"){
            const challengesCreatedInfo = await buildChallengesObject(challengeCreatedAddresses);
            setChallengesCreated(challengesCreatedInfo);

            const joinedChallengesInfo = await buildChallengesObject(joinedChallengesAddresses);
            setChallengesJoined(joinedChallengesInfo);

            const latestChallengesInfo = await buildChallengesObject(latestChallengeAddresses);
            setLatestChallenges(latestChallengesInfo);

            setLoadingChallenges(false);
            return;
        }


        const Logs = await retriveEventsFromBlock(factoryAddress, "event ChallengeCreated(address indexed admin, address challengeAddress, uint256 timestamp)")
        if (Logs.length === 0) {
            console.log("No challenge created have been found")
            setLoadingChallenges(false);
            return;
        }

        const parsedLogs = (Logs as GetLogsReturnType<typeof CHALLENGE_CREATED_ABI>).map((log) => ({
            admin: log.args.admin as Address,
            address: log.args.challengeAddress as Address,
            timestamp: log.args.timestamp?.toString() || Date.now().toString(),
        }));

        // 1. RECENT CHALLENGES - Add all recent events
        const mergedLatestAddresses = mergeUniqueChallenges(latestChallengeAddresses, parsedLogs);
        const updatedLatestChallengesInfo = await buildChallengesObject(mergedLatestAddresses);
        setLatestChallenges(updatedLatestChallengesInfo);

        // 2. CHALLENGES CREATED by current user - Filter for current user
        const recentCreatedByUser = parsedLogs.filter(
            (challenge) => challenge.admin.toLowerCase() === address?.toLowerCase()
        );
        const mergedCreatedAddresses = mergeUniqueChallenges(challengeCreatedAddresses, recentCreatedByUser);
        const updatedChallengesCreatedInfo = await buildChallengesObject(mergedCreatedAddresses);
        setChallengesCreated(updatedChallengesCreatedInfo);

        // 3. CHALLENGES JOINED by current user - Check if user joined any new challenges
        const newJoinedChallenges = await Promise.all(
            parsedLogs.map(async (challenge) => {
                // Skip if already in joined list
                if (joinedChallengesAddresses.some(c => c.address.toLowerCase() === challenge.address.toLowerCase())) {
                    return null;
                }
                
                const player = await readContract(config, {
                    address: challenge.address as Address,
                    abi: contractAbi,
                    functionName: 'players',
                    args: [address as Address],
                });
                
                const hasJoined = player[0];
                return hasJoined ? challenge : null;
            })
        );
        const validNewJoinedChallenges = newJoinedChallenges.filter((c): c is ChallengeAddresses => c !== null);
        const mergedJoinedAddresses = mergeUniqueChallenges(joinedChallengesAddresses, validNewJoinedChallenges);
        const updatedJoinedChallengesInfo = await buildChallengesObject(mergedJoinedAddresses);
        setChallengesJoined(updatedJoinedChallengesInfo);

        setLoadingChallenges(false);
    }


    
    
    //Redirection when challenge address is entered
    function handleChallengeClick(challengeAddress: Address) {
        router.push(`/mychallenges/${challengeAddress}`);
    }


    useEffect(() => {
        getChallengeEvents()
    }, [address])


    const LoadingSpinner = () => (
        <div className="flex flex-col items-center justify-center p-8 pt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Retrieving Challenges...</p>
        </div>
    );

    return (
        <>
            {loadingChallenges ? (
                <LoadingSpinner/> 
            ) : (
                <ChallengeTabs 
                    challengesCreated={challengesCreated}
                    challengesJoined={challengesJoined}
                    latestChallenges={latestChallenges}
                    handleChallengeClick={handleChallengeClick}
                />
            )}
        </>
    )
}

export default ChallengeList