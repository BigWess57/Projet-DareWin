'use client'
import { createContext, useContext, useEffect, useState } from "react";

import { contractAbi, contractAddress, fromBlock } from "@/constants/ChallengeInfo"
import { publicClient } from "@/utils/client";

import JoiningChallenge from "./StateElements.tsx/JoiningChallenge";
import OngoingChallenge from "./StateElements.tsx/OngoingChallenge";

import { Button } from "../ui/button";
import { toast } from "sonner";

import { parseAbiItem } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { DurationContext } from "./Challenge";


export const RefreshDisplayContext = createContext<(() => Promise<void>)>(async () => {});


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
    [WorkflowStatus.GatheringPlayers]: "Gathering Players",
    [WorkflowStatus.OngoingChallenge]: "Ongoing Challenge",
    [WorkflowStatus.VotingForWinner]: "Voting For Winner",
    [WorkflowStatus.ChallengeWon]: "Challenge Won",
};


const ChallengeState = () => {

/**********
 * Variables
 * *************/
    // const [description, setDescription] = useState<string>("");    
    const duration = useContext(DurationContext)


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

    //Get the challenge start event
    const [challengeStart, setChallengeStart] = useState<bigint>(0n);

    const getChallengeStartEvents = async() => {

        const Logs = await publicClient.getLogs({
            address: contractAddress,
            event: parseAbiItem("event ChallengeStarted(uint256 startingTime)"),
            // du premier bloc
            fromBlock: BigInt(fromBlock),
            // jusqu'au dernier
            toBlock: 'latest'
        })
        // console.log(Logs)
        
        if (Logs.length === 0) {
            console.error("Could not get the start of the challenge")
            toast.error("Error : Could not get the start of the challenge", {
                duration: 3000,
            });
            setChallengeStart(0n);
            return 0n;
        }else{
            const startingTime = Logs[0].args.startingTime || 0n;
            setChallengeStart(startingTime)
            return startingTime;
        }
        
    }

    const [currentDisplayStatus, setCurrentDisplayStatus] = useState<WorkflowStatus>(WorkflowStatus.GatheringPlayers)

    const calculateTimeLeft = (startingTime: bigint) => {
        const now = Math.floor(Date.now() / 1000)
        // console.log(duration)
        // console.log(Math.max(Number(startingTime) + Number(duration) - now, 0))
        return Math.max(Number(startingTime) + Number(duration) - now, 0)
    }
    const refreshDisplayStatus = async () => {
        //Get current state
        // console.log(status)
        //If current State is Ongoing challenge, get the start of the challenge. If the challenge is over, set the state to "Voting"
        if(status === WorkflowStatus.OngoingChallenge){
            // console.log(status as WorkflowStatus)
            const startingTime = await getChallengeStartEvents();
            if(calculateTimeLeft(startingTime) == 0 && startingTime !== 0n){
                setCurrentDisplayStatus(WorkflowStatus.VotingForWinner);
                return;
            }
        }
        setCurrentDisplayStatus(status as WorkflowStatus)
    }


/**************** Use Effect******** */
    useEffect(() => {
        refreshDisplayStatus()
    }, [status, duration])   


///******Display *******/

    const displayState = (() => {
        if (IsPending) return 'Loading…';
        if (error) return 'Error fetching description';

        // const currentState = status as WorkflowStatus | undefined;
        // if(currentState !== undefined)
        //     return stateLabels[currentState];
        // else
        //     return "Cannot display state"
        return stateLabels[currentDisplayStatus];
    })()

    

    return (
        <>
        <div>Challenge State : <span className="font-bold">{displayState}</span></div>

        <div className="p-5">
            {!IsPending && currentDisplayStatus === WorkflowStatus.GatheringPlayers && (
                <div>
                    <JoiningChallenge refetchStatus={refetchStatus}/>
                </div>
            )}

            {currentDisplayStatus === WorkflowStatus.OngoingChallenge && (
                <RefreshDisplayContext value={refreshDisplayStatus} >
                    <OngoingChallenge challengeStart={challengeStart} />
                </RefreshDisplayContext>
            )}

            {currentDisplayStatus === WorkflowStatus.VotingForWinner && (
                <>
                    <p>🗳️ Time to vote for the winner!</p>
                    <Button>Vote</Button>
                </>
            )}

            {currentDisplayStatus === WorkflowStatus.ChallengeWon && (
                <>
                    <p>🎉 The vote has concluded. A winner has been declared!</p>
                    <div>Winner : Shiggy!!</div>
                </>
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