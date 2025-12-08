import React, { useContext, useEffect, useState } from 'react'

import { Button } from '@/src/components/ui/button'
import { contractAbi } from '@/constants/ChallengeInfo'
import { retriveEventsFromBlock, wagmiEventRefreshConfig } from '@/utils/client'

import Event from "../Miscellaneous/Joined";

import { Address, getAddress, GetLogsReturnType, isAddressEqual, parseAbiItem, ReadContractErrorType } from 'viem'
import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from 'wagmi'
import { Checkbox } from '@/src/components/ui/checkbox';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';

import { ChallengeTimer } from './ChallengeTimer';
import { ContractAddressContext } from '../RouteBaseElements/ChallengePage';
import { CurrentTransactionToast } from '../Miscellaneous/CurrentTransactionToast';
import { getPlayers, PlayerEvent } from '@/utils/apiFunctions';
import { readContract, readContracts } from 'wagmi/actions';
import { config } from '@/src/app/RainbowKitAndWagmiProvider';

const VotingForWinner = ({status, refetchStatus} : {status: number | undefined, refetchStatus: (options?: RefetchOptions) => Promise<QueryObserverResult<unknown, ReadContractErrorType>>}) => {

    const {address} = useAccount()

    const contractAddress = useContext(ContractAddressContext)
    const t = useTranslations('Challenge.VotingForWinner')
    
/*********** Variables ************ */
    const [selectedPlayer, setSelectedPlayer] = useState<Address | null>(null)

    const [players, setPlayers] = useState<(Address | undefined)[]>([]);
    // const [playersVoted, setPlayersVoted] = useState<(Address | undefined)[]>([]);

    const [votingDuration, setVotingDuration] = useState<number>(0);

    //Current user a player 
    const [isPlayer, setIsPlayer] = useState<boolean>(false);
    //Current user voted?
    const [hasVoted, setHasVoted] = useState<boolean>(false);
    //has anyone Voted
    const [hasSomeoneVoted, setHasSomeoneVoted] = useState<boolean>(false);
    //has everyone voted?
    const [hasEveryoneVoted, setHasEveryoneVoted] = useState<boolean>(false);


    //Has voting started?
    const [votingStarted, setVotingStarted] = useState<bigint>(0n);
    //Has voting duration ended?
    const [votingDurationEnded, setVotingDurationEnded] = useState<boolean>(false);
    
    const [isRefetchingStatus, setIsRefetchingStatus] = useState<boolean>(false);

    const [loadingPlayers, setLoadingPlayers] = useState<boolean>(false)


/***************** 
 * Functions for interaction with the blokchain 
 * **************/   

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
                functionName: 'ipfsCid',
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'voteForWinnerStarted',
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'highestVotes',
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'currentPlayerNumber',
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'players',
                args: [address as Address],
            },
        ],
        account: address as `0x${string}` | undefined,
    })


    ////// Vote transaction hooks //////
    const { data: voteHash, isPending: isVoting, writeContract: voteContract, } = useWriteContract({
        mutation: {
            onError: (err) => {
                if(err.message.toLowerCase().includes("user rejected")){
                    toast.error(t('vote_failed_user_rejected'))
                }else{
                    toast.error(t('vote_failed', { error: err.message }))
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
                    toast.error(t('end_vote_rejected'))
                }else{
                    toast.error(t('end_vote_failed', { error: err.message }))
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
            toast.error(t('no_selected_player'), {
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

    const endWinnerVote = async () => {
        // Store current status before refetch
        const currentStatusValue = status;
        
        // Refetch and get the new result
        const { data: newStatus } = await refetchStatus();  

        // Compare: only call contract if status hasn't changed
        if (newStatus === currentStatusValue) {
            endVoteContract({
                address: contractAddress,
                abi: contractAbi,
                functionName: 'endWinnerVote',
            })
        } else {
            console.log("Status already updated by another transaction");
        }
    }




    const PLAYER_JOINED_ABI = parseAbiItem(
        'event PlayerJoined(address player)'
    );
    const PLAYER_WITHDRAWN_ABI = parseAbiItem(
        'event PlayerWithdrawn(address player)'
    );
    const EVENT_ABIS = [PLAYER_JOINED_ABI, PLAYER_WITHDRAWN_ABI]

    // Get players from GraphQL (through next server endpoint)
    const getAllPlayers = async() => {

        try {
            setLoadingPlayers(true)

            //Get players from GraphQL (through next server endpoint)
            const graphQLEvents = await getPlayers(`/api/challenges/getAllPlayers?address=${contractAddress}`);

            // Additionnally, GET RECENT ENTRIES BY RPC (In case TheGraph is slow)
            const Logs = await retriveEventsFromBlock(contractAddress, "event PlayerJoined(address player)", "event PlayerWithdrawn(address player)") as GetLogsReturnType<typeof EVENT_ABIS[number]>
            
            // Convert RPC logs to same format as GraphQL events
            const rpcEvents : PlayerEvent[] = Logs.map(log => ({
                player: log.args.player as Address,
                eventType: log.eventName === "PlayerJoined" ? "PlayerJoined" as const : "PlayerWithdrawn" as const,
            })).filter(event => event.player !== undefined);

            // Combine both event sources
            const allEvents = [...graphQLEvents, ...rpcEvents];

            // Process events chronologically to determine current state
            const playerStates = new Map<string, boolean>();
            
            for (const event of allEvents) {
                const playerLower = event.player.toLowerCase();
                
                if (event.eventType === "PlayerJoined") {
                    playerStates.set(playerLower, true);
                } else if (event.eventType === "PlayerWithdrawn") {
                    playerStates.set(playerLower, false);
                }
            }

            // Extract currently active players
            const activePlayers = Array.from(playerStates.entries())
                .filter(([_, isJoined]) => isJoined)
                .map(([player]) => getAddress(player)); // Convert back to checksummed Address
                
            setPlayers(activePlayers);

            //If current user is a player, set isPlayer to true
            let found = false;
            for (const player of activePlayers) {
                if(player == undefined){
                    console.error("player could not be retrieved");
                    continue;
                }
                if (address && isAddressEqual(player, address)) {
                    found = true;
                    break;
                }
            }
            setIsPlayer(found);

        } catch (error) {
            console.error("Error fetching players:", error);
        } finally {
            setLoadingPlayers(false);
        }

    }


    // Subscribe to the PlayerVoted event to act whenever there is a new one
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
            //If no one had voted, check the contract.
            if(!hasSomeoneVoted){
                readContracts(config, {
                    contracts : [
                        {
                            address: contractAddress,
                            abi: contractAbi,
                            functionName: 'voteForWinnerStarted',
                        },
                        {
                            address: contractAddress,
                            abi: contractAbi,
                            functionName: 'highestVotes',
                        },
                    ]
                })
                .then((res) => {
                    const challengeEnded = res[0].result;
                    const highestVotes = res[1].result;
                    //At least one player has voted
                    if(highestVotes!== undefined && highestVotes > 0){
                        setVotingStarted(challengeEnded as bigint)
                        setHasSomeoneVoted(true);
                    }
                })
                .catch(err => {
                    console.error( "Error retrieving contract info : ", err);
                });
            }

            //If everyone has not voted, check the contract.
            if(!hasEveryoneVoted){
                readContract(config, 
                    {
                        address: contractAddress,
                        abi: contractAbi,
                        functionName: 'currentPlayerNumber',
                    },
                )
                .then((res) => {
                    if(res === 0) {
                        setHasEveryoneVoted(true);
                    }
                    console.log(res)
                })
                .catch(err => {
                    console.error( "Error retrieving remaing voters : ", err);
                });
            }
            
        },
        onError(error) {
            console.error('Error watching PlayerVoted:', error)
        },
    })



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
                toast.error(t('unpin_error', { error: (json?.error ?? res.statusText) }), {
                    duration: 3000,
                });
            } else {
                console.log(json?.message ?? 'Unpinned (or not pinned)')
            }
        } catch (err) {
            console.error('Network error unpinning', err);
            toast.error(t('unpin_network_error'), {
                duration: 3000,
            });
        }
    }

/******* Use effect ***** */

    useEffect(() => {
        getAllPlayers()
        refetchReadData();
    }, [address])


    useEffect(() => {
        if (!readData) return

        // Voting duration
        const duration = readData[0].result
        setVotingDuration(duration as number)

        // cid of the merkle proofs
        const cid = readData[1].result
        attemptUnpin(cid as string);

        const challengeEnded = readData[2].result;
        setVotingStarted(challengeEnded as bigint)

        
        const anyoneVoted = (readData[3].result !== undefined && readData[3].result > 0) ? true : false;
        setHasSomeoneVoted(anyoneVoted);

        const everyoneVoted = readData[4].result === 0 ? true : false;
        setHasEveryoneVoted(everyoneVoted);

        const player = readData[5].result
        if (player == undefined){
            toast.error("Error : Could not retrieve player info from contract", {
                duration: 3000,
            });
            return;
        }
        //store if player has joined the challenge
        const hasVoted = player[1]
        setHasVoted(hasVoted)
            
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
            //set display at loading
            setIsRefetchingStatus(true)

            // Refetch after delay as backup
            const timer = setTimeout(async () => {
                try {
                    await refetchStatus();
                } catch (error) {
                    console.error('Failed to refetch status:', error);
                } finally {
                    setIsRefetchingStatus(false);
                }
            }, 1000)
            return () => {
                clearTimeout(timer);
                setIsRefetchingStatus(false);
            }
        }
        if(voteEndReceiptError) {
            toast.error(voteEndReceiptError.message, {
                duration: 3000,
            });
        }
    }, [voteEndSuccess, voteEndReceiptError])

    
/****** Display *******/

    const LoadingSpinner = () => (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mb-4"></div>
            <p className="text-gray-600">{t('updating_status')}</p>
        </div>
    );

    const LoadingPlayersSpinner = () => (
        <div className="flex flex-col items-center justify-center p-8">
            <div 
                className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-500 mb-4"
            />
            <p className="text-gray-600">{t('updating_players')}</p>
        </div>
    );

    return (
        <>
            {isRefetchingStatus ? (
                <LoadingSpinner/>
            ) : (
                <div className="space-y-8 p-6 bg-gradient-to-br from-[#1F243A] to-[#151A2A] border border-white/10 rounded-2xl shadow-xl text-white">
                    {hasEveryoneVoted ? (
                        // 🎉 All voted
                        <div className="flex flex-col items-center justify-center p-10 space-y-6">
                        <h1 className="text-3xl font-bold">{t('all_voted')}</h1>
                        <button
                            onClick={endWinnerVote}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-white font-semibold hover:brightness-110 transition"
                        >
                            {t('reveal_winners')}
                        </button>
                        </div>
                    ) : (
                        <>
                            {/* Top bar: prompt + vote button + timer/status */}
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                {/* Prompt & Vote */}
                                <div className="space-y-4">
                                <p className="text-2xl font-semibold flex items-center gap-2">
                                    {t('prompt')}
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
                                    ? t('already_voted')
                                    : !isPlayer
                                        ? t('not_a_player')
                                        : t('vote_button')}
                                </Button>
                                </div>

                                {/* Timer / Status */}
                                <div className="text-center space-y-2">
                                {hasSomeoneVoted ? (   
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
                                            <div className="italic text-white/50">{t('initializing_timer')}</div>
                                        )
                                    ) : (
                                    <div className="space-y-2">
                                        <div className="text-white/80">{t('vote_finished_still_can_vote')}</div>
                                        <button
                                        onClick={endWinnerVote}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg text-white font-medium hover:brightness-110 transition"
                                        >
                                            {t('reveal_winners')}
                                        </button>
                                    </div>
                                    )
                                ) : (
                                    <div className="text-xl italic text-white/60">{t('waiting_first_vote')}</div>
                                )}
                                </div>
                            </div>

                            {/* Players list with checkboxes */}
                            {loadingPlayers ? (
                                <LoadingPlayersSpinner/>
                            ) : (
                                <div className="p-6 bg-[#0B1126] border border-white/10 rounded-lg space-y-4">
                                    <h2 className="text-lg font-semibold text-white/80">{t('players')}</h2>
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
                                        <div className="italic text-white/50">{t('no_players_found')}</div>
                                    )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    <CurrentTransactionToast isConfirming={voteConfirming} isSuccess={voteSuccess} successMessage={t('success_voted')} txHash={voteHash}/>
                    <CurrentTransactionToast isConfirming={voteEndConfirming} isSuccess={voteEndSuccess} successMessage={t('success_revealed')} txHash={endVoteHash}/>
                </div>
            )}
        </>
    )
}

export default VotingForWinner