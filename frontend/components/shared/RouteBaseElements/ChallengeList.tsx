import React, { useEffect, useState } from 'react'

import { factoryAddress } from '@/constants/ChallengeFactoryInfo';
import { retriveEventsFromBlock } from '@/utils/client';

import { Address, formatEther, GetLogsReturnType, isAddressEqual, parseAbi, parseAbiItem } from 'viem';
import { useAccount } from 'wagmi';
import { contractAbi } from '@/constants/ChallengeInfo';
import { readContract, readContracts } from 'wagmi/actions';
import { config } from '@/app/RainbowKitAndWagmiProvider';
import { useRouter } from 'next/navigation';
import { retrieveChallenges } from '@/utils/apiFunctions';
import ChallengePreview from '../Miscellaneous/ChallengePreview';
import { ChallengeTabs } from '../Miscellaneous/ChallengeTabs';


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
    blockNumber: string
    txHash: string
    createdAt: string
}

type ChallengeAddresses = {
    admin: Address,
    address: Address,
    blockNumber: string,
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
                timestampOfCreation: challenge.blockNumber,
                groupMode: groupMode as boolean,
            })
        }

        return challengesInfo;
    }



    const getChallengeEvents = async() => {     

        if(address == undefined){
            return
        }

    //FOR CHALLENGES CREATED by current user
        const ChallengesCreated: ChallengeCreated[] = await retrieveChallenges(`/api/challengeFactory/getChallengesCreated?admin=${address}`);

        const challengeAddresses = ChallengesCreated.map((challenge: ChallengeCreated) => ({
            admin: challenge.admin as Address,
            address: challenge.challengeAddress as Address,
            blockNumber: challenge.blockNumber as string,
        }))

        const challengesCreatedInfo = await buildChallengesObject(challengeAddresses);
        setChallengesCreated(challengesCreatedInfo)



    //FOR CHALLENGES JOINED by current user

        //Get All challenges
        const AllChallenges: ChallengeCreated[] = await retrieveChallenges(`/api/challengeFactory/getAllChallenges`);


        const results = await Promise.all(
            AllChallenges.map(async (challenge) => {
                const player = await readContract(config, {
                    address: challenge.challengeAddress as Address,
                    abi: contractAbi,
                    functionName: 'Players',
                    args: [address as Address],
                });

                const hasJoined = player[0];
                if (hasJoined) {
                    // return a simplified object
                    return {
                        admin: challenge.admin as Address,
                        address: challenge.challengeAddress as Address,
                        blockNumber: challenge.blockNumber as string,
                    };
                }

                return null; // user has not joined
            })
        );

        const joinedChallengesAddresses = results.filter((c): c is ChallengeAddresses => c !== null);

        const joinedChallengesInfo = await buildChallengesObject(joinedChallengesAddresses);
        setChallengesJoined(joinedChallengesInfo)



    //FOR RECENT CHALLENGES

        const amountToRetrieve = 100;//Hardcoded for now
        const LatestChallenges: ChallengeCreated[] = await retrieveChallenges(`/api/challengeFactory/getLatestChallenges?number=${amountToRetrieve}`);

        const latestChallengeAddresses = LatestChallenges.map((challenge: ChallengeCreated) => ({
            admin: challenge.admin as Address,
            address: challenge.challengeAddress as Address,
            blockNumber: challenge.blockNumber as string,
        }))

        const latestChallengesInfo = await buildChallengesObject(latestChallengeAddresses);
        setLatestChallenges(latestChallengesInfo)

    }
    
    
    //Redirection when challenge address is entered
    function handleChallengeClick(challengeAddress: Address) {
        router.push(`/mychallenges/${challengeAddress}`);
    }


    useEffect(() => {
        getChallengeEvents()
    }, [address])

    return (
        <ChallengeTabs 
            challengesCreated={challengesCreated}
            challengesJoined={challengesJoined}
            latestChallenges={latestChallenges}
            handleChallengeClick={handleChallengeClick}
        />
    )
}

export default ChallengeList