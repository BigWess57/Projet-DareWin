'use client'
import { useContext, useEffect, useState } from "react";

import { contractAbi } from "@/constants/ChallengeInfo"
import { retriveEventsFromBlock } from "@/utils/client";

import JoiningChallenge from "./StateElements.tsx/JoiningChallenge";
import OngoingChallenge from "./StateElements.tsx/OngoingChallenge";

import { toast } from "sonner";

import { GetLogsReturnType, parseAbiItem } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { DurationContext } from "./RouteBaseElements/ChallengePage";
import VotingForWinner from "./StateElements.tsx/VotingForWinner";
import ChallengeWon from "./StateElements.tsx/ChallengeWon";
import { ContractAddressContext } from "./RouteBaseElements/ChallengePage";


// export const RefreshDisplayContext = createContext<(() => Promise<void>)>(async () => {});


//State Enum
enum WorkflowStatus {
    // État initial : enregistrement des joueurs
    GatheringPlayers,
    OngoingChallenge,
    VotingForWinner,
    ChallengeWon
}
//To display state names
const stateLabels = {
    [WorkflowStatus.GatheringPlayers]: "Regroupement des joueurs",
    [WorkflowStatus.OngoingChallenge]: "Challenge en cours",
    [WorkflowStatus.VotingForWinner]: "Vote pour élire le gagnant",
    [WorkflowStatus.ChallengeWon]: "Challenge terminé",
};


const ChallengeState = () => {

/**********
 * Variables
 * *************/
    // const [description, setDescription] = useState<string>("");    
    const duration = useContext(DurationContext)
    const contractAddress = useContext(ContractAddressContext)

/***************** 
 * Functions for interaction with the blokchain 
 * **************/
    const {address} = useAccount()

    // Used to read the contract current state
    const { data: status, error: error, isPending: IsPending, refetch: refetchStatus } = useReadContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'currentStatus',
        account: address as `0x${string}` | undefined,
    })

    const { data: challengeStartTime, error: errorStartTime, isPending: IsStartTimePending, refetch: refetchStartTime } = useReadContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'challengeStartTimestamp',
        account: address as `0x${string}` | undefined,
    })


    //Get the challenge start
    const [challengeStart, setChallengeStart] = useState<bigint>(0n);

    //ABI types for events
    // const CHALLENGE_STARTED_ABI = parseAbiItem(
    //     "event ChallengeStarted(uint256 startingTime)"
    // );

    // const getChallengeStartEvents = async() => {

    //     const Logs = await retriveEventsFromBlock(contractAddress, "event ChallengeStarted(uint256 startingTime)") as GetLogsReturnType<typeof CHALLENGE_STARTED_ABI>
        
    //     if (Logs.length === 0) {
    //         console.error("Could not get the start of the challenge")
    //         toast.error("Error : Could not get the start of the challenge", {
    //             duration: 3000,
    //         });
    //         setChallengeStart(0n);
    //         return 0n;
    //     }else{
    //         const startingTime = Logs[0].args.startingTime || 0n;
    //         setChallengeStart(startingTime)
    //         return startingTime;
    //     }
        
    // }

    

    const [currentDisplayStatus, setCurrentDisplayStatus] = useState<WorkflowStatus>(WorkflowStatus.GatheringPlayers)

    const calculateTimeLeft = (startingTime: bigint) => {
        const now = Math.floor(Date.now() / 1000)
        return Math.max(Number(startingTime) + Number(duration) - now, 0)
    }
    const refreshDisplayStatus = async () => {
        //If current State is Ongoing challenge, get the start of the challenge. If the challenge is over, set the state to "Voting"
        if(status === WorkflowStatus.OngoingChallenge){
            // const startingTime = await getChallengeStartEvents();
            if(calculateTimeLeft(challengeStart) == 0 && challengeStart !== 0n){
                setCurrentDisplayStatus(WorkflowStatus.VotingForWinner);
                return;
            }
        }
        setCurrentDisplayStatus(status as WorkflowStatus)
    }


/**************** Use Effect******** */
    useEffect(() => {
        refetchStartTime()
        refreshDisplayStatus()
    }, [status, duration])  
    
    useEffect(() => {
        if(!challengeStartTime) return;
        setChallengeStart(challengeStartTime);
    }, [challengeStartTime])


///******Display *******/

    const displayState = (() => {
        if (IsPending) return 'Loading…';
        if (error) return 'Error fetching description';

        return stateLabels[currentDisplayStatus];
    })()

    

    return (
        <>
            <h1 className="text-xl font-bold m-5">
                Etat du Challenge: <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">{displayState}</span>
            </h1>
            <div /*className="p-5 border"*/>
                {!IsPending && currentDisplayStatus === WorkflowStatus.GatheringPlayers && (
                    <div>
                        <JoiningChallenge refetchStatus={refetchStatus}/>
                    </div>
                )}

                {currentDisplayStatus === WorkflowStatus.OngoingChallenge && (
                    <OngoingChallenge challengeStart={challengeStart} refreshDisplay={refreshDisplayStatus} />
                )}

                {currentDisplayStatus === WorkflowStatus.VotingForWinner && (
                    <VotingForWinner refetchStatus={refetchStatus}/>
                )}

                {currentDisplayStatus === WorkflowStatus.ChallengeWon && (
                    <ChallengeWon/>
                )}
                {/* Fallback if none of the above matched */}
                {!IsPending &&
                !Object.values(WorkflowStatus).includes(currentDisplayStatus) && (
                    <p className="text-red-500">❌ Error displaying state</p>
                )}
            </div>
        
        </>
    )
}

export default ChallengeState