import React, { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { contractAbi, contractAddress, fromBlock } from '@/constants/ChallengeInfo'
import { publicClient } from '@/utils/client'

import Event from "../Event";

import { Address, parseAbiItem } from 'viem'
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const VotingForWinner = () => {

    const {address} = useAccount()


/***************** 
 * Functions for interaction with the blokchain 
 * **************/   

    //Used to interact with the contract
    const { data: hash, error, isPending: setIsPending, writeContract } = useWriteContract({
        mutation: {
            //Check si les transaction reussissent/echouent a se lancer
            // onSuccess: () => {
    
            // },
            // onError: (error) => {
    
            // }
        }
    })
    //Used to check the current transaction state
    const { isLoading: isConfirming, isSuccess, error: errorConfirmation } = useWaitForTransactionReceipt({
        hash
    }) 

    const voteForWinner = () => {
        writeContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'voteForWinner',
            args: [selectedPlayer],
        })
    }


    //Events
    const [events, setEvents] = useState<(Address | undefined)[]>([]);
    
    const getEvents = async() => {

        const Logs = await publicClient.getLogs({
            address: contractAddress,
            event: parseAbiItem("event PlayerJoined(address player)"),
            // du premier bloc
            fromBlock: BigInt(fromBlock),
            // jusqu'au dernier
            toBlock: 'latest' // Pas besoin valeur par défaut
        })
        console.log(Logs)

        setEvents(Logs.map(
            log => (log.args.player)
        ))
    }



/*********** Variables ************ */
    const [selectedPlayer, setSelectedPlayer] = useState<Address | null>(null)

    useEffect(() => {
        getEvents();
    }, [address])





/******* Use effect ***** */
//Lorsqu'une transaction est effectuée, informer l'utilisateur de l'outcome
    useEffect(() => {
        if(isSuccess) {
            toast.success("Success", {
                description: "You have successfully voted",
            })
        }
        if(errorConfirmation) {
            toast.error(errorConfirmation.message, {
                duration: 3000,
            });
        }
    }, [isSuccess, errorConfirmation])


/****** Display *******/
    return (
        <div>
            <p>🗳️ Time to vote for the winner!</p>
            <Button disabled={!selectedPlayer} onClick={voteForWinner}>Vote</Button>

            <div className="p-10">
                <div>Players :</div>
                <div className="mt-4 flex flex-col">
                    {events?.length > 0 ? [...events].reverse().map((addr) => {
                        return (
                            <div className='flex-between gap-2'  key={crypto.randomUUID()}>
                                <Checkbox
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
    )
}

export default VotingForWinner