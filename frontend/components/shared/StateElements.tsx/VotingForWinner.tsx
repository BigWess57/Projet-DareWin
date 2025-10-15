import React, { useContext, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { contractAbi } from '@/constants/ChallengeInfo'
import { retriveEventsFromBlock, wagmiEventRefreshConfig } from '@/utils/client'

import Event from "../Miscellaneous/Joined";

import { Address, GetLogsReturnType, isAddressEqual, parseAbi, parseAbiItem, ReadContractErrorType } from 'viem'
import { useAccount, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from 'wagmi'
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';

import { ChallengeTimer } from './ChallengeTimer';
import { ContractAddressContext } from '../RouteBaseElements/ChallengePage';
import { CurrentTransactionToast } from '../Miscellaneous/CurrentTransactionToast';
import { getPlayers } from '@/utils/apiFunctions';

const VotingForWinner = ({refetchStatus} : {refetchStatus: (options?: RefetchOptions) => Promise<QueryObserverResult<unknown, ReadContractErrorType>>}) => {

    const {address} = useAccount()

    const contractAddress = useContext(ContractAddressContext)
    
/*********** Variables ************ */
    const [selectedPlayer, setSelectedPlayer] = useState<Address | null>(null)

    const [players, setPlayers] = useState<(Address | undefined)[]>([]);
    const [playersVoted, setPlayersVoted] = useState<(Address | undefined)[]>([]);

    const [votingDuration, setVotingDuration] = useState<number>(0);

    //Current user a player 
    const [isPlayer, setIsPlayer] = useState<boolean>(false);
    //Current user voted?
    const [hasVoted, setHasVoted] = useState<boolean>(false);
    //has everyone voted?
    const [hasEveryoneVoted, setHasEveryoneVoted] = useState<boolean>(false);

    //Has voting started?
    const [votingStarted, setVotingStarted] = useState<bigint>(0n);
    //Has voting duration ended?
    const [votingDurationEnded, setVotingDurationEnded] = useState<boolean>(false);
    


    // //EVENTS ABI
    // const PLAYER_JOINED_ABI = parseAbiItem(
    //         'event PlayerJoined(address player)'
    // );
    // const PLAYER_WITHDRAWN_ABI = parseAbiItem(
    //     'event PlayerWithdrawn(address player)'
    // );
    // const EVENT_ABIS = [PLAYER_JOINED_ABI, PLAYER_WITHDRAWN_ABI]

    // const PLAYER_VOTED_ABI = parseAbiItem(
    //     "event PlayerVoted(address voter, address votedFor)"
    // );
    // const CHALLENGE_ENDED_ABI = parseAbiItem(
    //     "event ChallengeEnded(uint256 endTime)"
    // );

/***************** 
 * Functions for interaction with the blokchain 
 * **************/   

    // Used to read the contract (voting delay)
    // const { data: durationVote, error: error, isPending: IsPending, refetch: refetchVotingDuration } = useReadContract({
    //     address: contractAddress,
    //     abi: contractAbi,
    //     functionName: 'MINIMUM_DELAY_BEFORE_ENDING_VOTE',
    //     account: address as `0x${string}` | undefined,
    // })

    const { data: readData, error: error, isPending: IsPending, refetch: refetchReadData } = useReadContracts({
        contracts: [
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'MINIMUM_DELAY_BEFORE_ENDING_VOTE',
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'groupMode',
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'ipfsCid',
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'voteForWinnerStarted',
            }
        ],
        account: address as `0x${string}` | undefined,
    })


    ////// Vote transaction hooks //////
    const { data: voteHash, isPending: isVoting, writeContract: voteContract, } = useWriteContract({
        mutation: {
            onError: (err) => {
                if(err.message.toLowerCase().includes("user rejected")){
                    toast.error("Vote failed: Use rejected the request")
                }else{
                    toast.error("Vote failed: " + err.message)
                }
            },
        },
    })
    //Used to check the current transaction state
    const { isLoading: voteConfirming, isSuccess: voteSuccess, error: voteReceiptError, } = useWaitForTransactionReceipt({
        hash: voteHash
    }) 

    ////// End Vote transaction hooks //////
    const { data: endVoteHash, isPending: isEndingVote, writeContract: endVoteContract } = useWriteContract({
        mutation: {
            onError: (err) => {
                if(err.message.toLowerCase().includes("user rejected")){
                    toast.error("End Vote failed: Use rejected the request")
                }else{
                    toast.error("End Vote failed: " + err.message)
                }
            },
        },
    })
    //Used to check the current transaction state
    const { isLoading: voteEndConfirming, isSuccess: voteEndSuccess, error: voteEndReceiptError } = useWaitForTransactionReceipt({
        hash : endVoteHash
    }) 


    const voteForWinner = () => {
        if(selectedPlayer == null){
            toast.error("Error : No selected player", {
                duration: 3000,
            });
            return
        }
        voteContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'voteForWinner',
            args: [selectedPlayer],
        })
    }

    const endWinnerVote = () => {
        endVoteContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'endWinnerVote',
        })
    }


    const getAllPlayers = async() => {
        const CurrentPlayers = await getPlayers(`/api/challenges/getAllPlayers?address=${contractAddress}`);
        setPlayers(CurrentPlayers);

        //If current user is a player, set isPlayer to true
        let found = false;
        for (const player of CurrentPlayers) {
            if(player == undefined){
                console.error("player could not be retrieved");
                continue;
            }
            if (address && player == address.toLowerCase()) {
                found = true;
                break;
            }
        }
        setIsPlayer(found);

        return CurrentPlayers;
    }

    //Events

    // const getPlayersEvents = async() => {

    //     const Logs = await retriveEventsFromBlock(contractAddress, "event PlayerJoined(address player)", "event PlayerWithdrawn(address player)") as GetLogsReturnType<typeof EVENT_ABIS[number]>

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
    //     const players = Array.from(playerStates.entries())
    //         .filter(([_, isJoined]) => isJoined)
    //         .map(([player]) => player);

    //     setPlayers(players)

    //     //If current user is a player, set isPlayer to true
    //     let found = false;
    //     for (const player of players) {
    //         if(player == undefined){
    //             console.error("player could not be retrieved");
    //             continue;
    //         }
    //         if (address && isAddressEqual(player, address)) {
    //             found = true;
    //             break;
    //         }
    //     }
    //     setIsPlayer(found);

    //     return players
    // }


    //Helper function to check if everyone has voted
    
    const checkEveryoneVoted = (
        players : (Address | undefined)[],
        playersVoted : (Address | undefined)[],
        lastVotedLength : number = 0,
    ) => {
        if(players.length > 0 && (players.length == (playersVoted.length + lastVotedLength) ) ){
            setHasEveryoneVoted(true);
        }
    }

    // //Get players voted events
    // const getPlayersVotedEvents = async(playersArray : (Address | undefined)[]) => {

    //     const Logs = await retriveEventsFromBlock(contractAddress, "event PlayerVoted(address voter, address votedFor)") as GetLogsReturnType<typeof PLAYER_VOTED_ABI>

    //     const VotedPlayers = Logs.map(
    //         log => (log.args.voter)
    //     )
    //     setPlayersVoted(VotedPlayers)

    //     let setVoted = false;
    //     //If current player has voted, set hasVoted to true
    //     for (const log of Logs) {
    //         const { args } = log;
    //         if(args.voter == undefined){
    //             console.error("voter could not be retrieved");
    //             continue;
    //         }
    //         if (args && address && isAddressEqual(args.voter, address)) {
    //             setVoted = true;
    //             break;
    //         }
    //     }
    //     //Set hasVoted, depending on if we found a matching address or not
    //     setHasVoted(setVoted);

    //     //Check if everyone has voted
    //     checkEveryoneVoted(playersArray, VotedPlayers)
    // }

    const getAllPlayersVoted = async(playersArray : (Address | undefined)[]) => {
        const VotedPlayers : Address[] = await getPlayers(`/api/challenges/getAllPlayersVoted?address=${contractAddress}`);
        setPlayersVoted(VotedPlayers);

        let setVoted = false;
        //If current player has voted, set hasVoted to true
        for (const player of VotedPlayers) {
            // const { args } = player;
            if(player == undefined){
                console.error("voter could not be retrieved");
                continue;
            }
            if (address && isAddressEqual(player, address)) {
                setVoted = true;
                break;
            }
        }
        
        //Set hasVoted, depending on if we found a matching address or not
        setHasVoted(setVoted);

        //Check if everyone has voted
        checkEveryoneVoted(playersArray, VotedPlayers)
    }


    // In addition, Subscribe to the PlayerVoted event to act whenever there is a new one
    useWatchContractEvent({
        address: contractAddress,
        abi: [
            parseAbiItem(
                'event PlayerVoted(address voter, address votedFor)',
            ),
        ],
        eventName: 'PlayerVoted',
        config: wagmiEventRefreshConfig,
        poll: true,
        pollingInterval: 5_000,
        onLogs(logs) {
            logs.forEach((log) => {
                const { voter } = log.args;
                if(voter === undefined) return;

                if(address && isAddressEqual(voter, address)){
                    setHasVoted(true);
                }

                setPlayersVoted((prev) => {
                    //store the voter only if not already stored
                    for (const voted of playersVoted) {
                        if(voted === undefined) continue;

                        if(isAddressEqual(voter, voted)){
                            return prev;
                        }
                    }
                    //Check if everyone has voted (only if this is a new voter)
                    checkEveryoneVoted(players, playersVoted, logs.length)
                    //add voter to array of players who voted
                    return [...prev, voter]
                });
            })
        },
        onError(error) {
            console.error('Error watching PlayerVoted:', error)
        },
    })

    

    // const getChallengeEndedEvents = async() => {

    //     const Logs = await retriveEventsFromBlock(contractAddress, "event ChallengeEnded(uint256 endTime)") as GetLogsReturnType<typeof CHALLENGE_ENDED_ABI>

    //     if (Logs.length === 0) {
    //         setVotingStarted(0n);
    //         return 0n;
    //     }else{
    //         const startingTime = Logs[0].args.endTime || 0n;
    //         setVotingStarted(startingTime)
    //         // console.log("setting start time :", startingTime)
    //         return startingTime;
    //     }
    // }
    



/****** Other functions ******* */
    const endVoteTimerDisplay = async () => {
        setVotingDurationEnded(true);
    }

    //Unpin the merkle proofs for joining the challenge, if
    async function attemptUnpin(cid: string) {
        try {
            const res = await fetch('/api/ipfsProofs/unpinProofs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cid }),
            });
            const json = await res.json();
            if (!res.ok) {
                console.error('Unpin failed', json);
                toast.error("Error unpinning Proofs on IPFS: " + (json?.error ?? res.statusText), {
                    duration: 3000,
                });
            } else {
                console.log(json?.message ?? 'Unpinned (or not pinned)')
            }
        } catch (err) {
            console.error('Network error unpinning', err);
            toast.error('Network error when trying to unpin', {
                duration: 3000,
            });
        }
    }

/******* Use effect ***** */

    useEffect(() => {
        // getPlayersEvents().then((playersArray) => {
        //     getPlayersVotedEvents(playersArray);
        // });
        getAllPlayers().then((playersArray) => {
            getAllPlayersVoted(playersArray);
        });
        // getChallengeEndedEvents();
        // refetchVotingDuration();
        refetchReadData();
    }, [address])


    useEffect(() => {
        if (!readData) return

        // Voting duration
        const duration = readData[0].result
        setVotingDuration(duration as number)

        // mode of the challenge
        const groupMode = readData[1].result;

        // cid of the merkle proofs
        const cid = readData[2].result

        //only try to unpin if groupMode = true, to avoid unnecessary Api calls
        if(groupMode){
            attemptUnpin(cid as string);
        }

        const challengeEnded = readData[3].result;
        setVotingStarted(challengeEnded as bigint)
            
    }, [readData, address])


//Lorsqu'une transaction est effectuée, informer l'utilisateur de l'outcome
//For vote
    useEffect(() => {
        if(voteSuccess) {
            // getAllPlayersVoted(players);
            refetchReadData();
            setHasVoted(true);
        }
        if(voteReceiptError) {
            toast.error(voteReceiptError.message, {
                duration: 3000,
            });
        }
    }, [voteSuccess, voteReceiptError])

//For ending vote
    useEffect(() => {
        if(voteEndSuccess) {
            refetchStatus()
        }
        if(voteEndReceiptError) {
            toast.error(voteEndReceiptError.message, {
                duration: 3000,
            });
        }
    }, [voteEndSuccess, voteEndReceiptError])


/****** Display *******/
    return (

        <div className="space-y-8 p-6 bg-gradient-to-br from-[#1F243A] to-[#151A2A] border border-white/10 rounded-2xl shadow-xl text-white">
            {hasEveryoneVoted ? (
                // 🎉 All voted
                <div className="flex flex-col items-center justify-center p-10 space-y-6">
                <h1 className="text-3xl font-bold">Vote terminé ! Tout le monde a voté</h1>
                <button
                    onClick={endWinnerVote}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-white font-semibold hover:brightness-110 transition"
                >
                    Révéler le(s) gagnant(s)
                </button>
                </div>
            ) : (
                <>
                {/* Top bar: prompt + vote button + timer/status */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Prompt & Vote */}
                    <div className="space-y-4">
                    <p className="text-2xl font-semibold flex items-center gap-2">
                        🗳️ C’est l’heure de voter !
                    </p>
                    <Button
                        disabled={!selectedPlayer || hasVoted || !isPlayer}
                        onClick={voteForWinner}
                        className={`px-5 py-2 rounded-lg font-medium transition
                        ${!isPlayer
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : hasVoted
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:brightness-110'}
                        `}
                    >
                        {hasVoted
                        ? "Vous avez déjà voté"
                        : !isPlayer
                            ? "Vous n'êtes pas un joueur"
                            : "Voter"}
                    </Button>
                    </div>

                    {/* Timer / Status */}
                    <div className="text-center space-y-2">
                    {playersVoted.length > 0 ? (
                        !votingDurationEnded ? (
                        votingStarted > 0n ? (
                            <div className="space-y-1">
                            <ChallengeTimer
                                startingTime={votingStarted}
                                duration={votingDuration ? BigInt(votingDuration) : 0n}
                                refreshDisplay={endVoteTimerDisplay}
                            />
                            </div>
                        ) : (
                            <div className="italic text-white/50">Initialisation du timer…</div>
                        )
                        ) : (
                        <div className="space-y-2">
                            <div className="text-white/80">Vote terminé ! (vous pouvez toujours voter si ce n'est pas fait)</div>
                            <button
                            onClick={endWinnerVote}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-white font-medium hover:brightness-110 transition"
                            >
                                Révéler le(s) gagnant(s)
                            </button>
                        </div>
                        )
                    ) : (
                        <div className="text-xl italic text-white/60">En attente du premier vote…</div>
                    )}
                    </div>
                </div>

                {/* Players list with checkboxes */}
                <div className="p-6 bg-[#0B1126] border border-white/10 rounded-lg space-y-4">
                    <h2 className="text-lg font-semibold text-white/80">Joueurs :</h2>
                    <div className="flex flex-col gap-3">
                    {players?.length > 0 ? (
                        players.map((addr) => (
                        <label
                            key={addr}
                            htmlFor={`select-${addr}`}
                            className="flex items-center gap-3 p-2 bg-[#1A1F33] rounded-lg hover:bg-[#22283F] transition"
                        >
                            <Checkbox
                                disabled={hasVoted || !isPlayer}
                                id={`select-${addr}`}
                                checked={selectedPlayer == addr}
                                onCheckedChange={(checked) => {
                                    setSelectedPlayer( (checked && addr != undefined) ? addr : null)
                                }}
                                className="h-5 w-5 text-cyan-400 bg-[#0B1126] border border-white/20 rounded transition"
                            />
                            <div className="flex-1 text-sm font-mono text-white truncate">
                            <Event address={addr} />
                            </div>
                        </label>
                        ))
                    ) : (
                        <div className="italic text-white/50">(Aucun joueur trouvé)</div>
                    )}
                    </div>
                </div>
                </>
            )}
            <CurrentTransactionToast isConfirming={voteConfirming} isSuccess={voteSuccess} successMessage="You successfully voted!" />
            <CurrentTransactionToast isConfirming={voteEndConfirming} isSuccess={voteEndSuccess} successMessage="You successfully reveiled the winner!" />
        </div>
    )
}

export default VotingForWinner