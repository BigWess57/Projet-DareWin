import React, { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { contractAbi, contractAddress, fromBlock } from '@/constants/ChallengeInfo'
import { publicClient } from '@/utils/client'

import Event from "../Event";

import { Address, isAddressEqual, parseAbiItem, ReadContractErrorType } from 'viem'
import { useAccount, useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from 'wagmi'
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { isDataView } from 'util/types';
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';

const VotingForWinner = ({refetchStatus} : {refetchStatus: (options?: RefetchOptions) => Promise<QueryObserverResult<unknown, ReadContractErrorType>>}) => {

    const {address} = useAccount()

    
/*********** Variables ************ */
const [selectedPlayer, setSelectedPlayer] = useState<Address | null>(null)

const [players, setPlayers] = useState<(Address | undefined)[]>([]);
const [playersVoted, setPlayersVoted] = useState<(Address | undefined)[]>([]);

//Current user a player 
const [isPlayer, setIsPlayer] = useState<boolean>(false);
//Current user voted?
const [hasVoted, setHasVoted] = useState<boolean>(false);
//has everyone voted?
const [hasEveryoneVoted, setHasEveryoneVoted] = useState<boolean>(false);


/***************** 
 * Functions for interaction with the blokchain 
 * **************/   

    ////// Vote transaction hooks //////
    const { data: voteHash, isPending: isVoting, writeContract: voteContract, } = useWriteContract({
        mutation: {
            onError: (err) => toast.error("Vote failed: " + err.message),
        },
    })
    //Used to check the current transaction state
    const { isLoading: voteConfirming, isSuccess: voteSuccess, error: voteReceiptError, } = useWaitForTransactionReceipt({
        hash: voteHash
    }) 

    ////// End Vote transaction hooks //////
    const { data: endVoteHash, isPending: isEndingVote, writeContract: endVoteContract } = useWriteContract({
        mutation: {
            onError: (err) => toast.error("Vote failed: " + err.message),
        },
    })
    //Used to check the current transaction state
    const { isLoading: voteEndConfirming, isSuccess: voteEndSuccess, error: voteEndReceiptError } = useWaitForTransactionReceipt({
        hash : endVoteHash
    }) 


    const voteForWinner = () => {
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


    //Events

    const getPlayersEvents = async() => {

        const Logs = await publicClient.getLogs({
            address: contractAddress,
            event: parseAbiItem("event PlayerJoined(address player)"),
            // du premier bloc
            fromBlock: BigInt(fromBlock),
            // jusqu'au dernier
            toBlock: 'latest' // Pas besoin valeur par défaut
        })
        console.log(Logs)

        const players = Logs.map(
            log => (log.args.player)
        )

        setPlayers(players)

        //If current user is a player, set isPlayer to true
        for (const log of Logs) {
            const { args } = log;
            if(args.player == undefined){
                console.error("player could not be retrieved");
                continue;
            }
            if (args && address && isAddressEqual(args.player, address)) {
                setIsPlayer(true);
                break;
            }
        }
        return players
    }


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

    //Get players voted events
    const getPlayersVotedEvents = async(playersArray : (Address | undefined)[]) => {

        const Logs = await publicClient.getLogs({
            address: contractAddress,
            event: parseAbiItem("event PlayerVoted(address voter, address votedFor)"),
            // du premier bloc
            fromBlock: BigInt(fromBlock),
            // jusqu'au dernier
            toBlock: 'latest' // Pas besoin valeur par défaut
        })
        console.log("getPlayersVotedEvents : ", Logs)

        const VotedPlayers = Logs.map(
            log => (log.args.voter)
        )
        setPlayersVoted(VotedPlayers)

        let setVoted = false;
        //If current player has voted, set hasVoted to true
        for (const log of Logs) {
            const { args } = log;
            if(args.voter == undefined){
                console.error("voter could not be retrieved");
                continue;
            }
            if (args && address && isAddressEqual(args.voter, address)) {
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
        onLogs(logs) {
            console.log('New logs!', logs);
            logs.forEach((log) => {
                const { voter } = log.args;
                if(voter === undefined) return;

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

    

/******* Use effect ***** */

useEffect(() => {
        getPlayersEvents().then((playersArray) => {
            getPlayersVotedEvents(playersArray);
        });
    }, [address])


//Lorsqu'une transaction est effectuée, informer l'utilisateur de l'outcome
//For vote
    useEffect(() => {
        if(voteSuccess) {
            getPlayersVotedEvents(players);
            toast.success("Success", {
                description: "You have successfully voted",
            })
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
            toast.success("Success", {
                description: "You have successfully voted",
            })
        }
        if(voteEndReceiptError) {
            toast.error(voteEndReceiptError.message, {
                duration: 3000,
            });
        }
    }, [voteEndSuccess, voteEndReceiptError])


/****** Display *******/
    return (
        <div>
            {hasEveryoneVoted ? (
                <div className='p-10 flex-center'>
                    <div className='flex flex-col gap-8'>
                        <h1 className='text-2xl'>Voted Ended ! Everyone has voted !</h1>
                        <Button onClick={endWinnerVote}>Reveal Winner(s)</Button>
                    </div>
                </div>
            ) : (
                <div>
                    <p>🗳️ Time to vote for the winner!</p>
                    <Button disabled={!selectedPlayer || hasVoted || !isPlayer} onClick={voteForWinner}>
                        {hasVoted && <div>You have already voted</div>}
                        {!isPlayer && <div>You are not a player</div>}
                        {!hasVoted && isPlayer && <div>Vote</div>}
                    </Button>

                    <div className="p-10">
                        <div>Players :</div>
                        <div className="mt-4 flex flex-col">
                            {players?.length > 0 ? players.map((addr) => {
                                return (
                                    <div className='flex-between gap-2'  key={crypto.randomUUID()}>
                                        <Checkbox
                                            disabled={hasVoted || !isPlayer}
                                            id={`select-${addr}`}
                                            checked={selectedPlayer == addr}
                                            onCheckedChange={(checked) => {
                                                setSelectedPlayer( (checked && addr != undefined) ? addr : null)
                                            }}
                                        />
                                        <div className='w-full'>
                                            <Event address={addr} />
                                        </div>
                                    </div>
                                )
                            }) : <div className="italic">(No player found)</div>
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default VotingForWinner