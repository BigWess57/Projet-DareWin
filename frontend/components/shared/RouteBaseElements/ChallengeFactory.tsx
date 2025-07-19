'use client'
import { z } from 'zod'

import { useAccount, useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from "wagmi"

import ChallengeForm, { ChallengeFormValues } from "../Miscellaneous/ChallengeForm"
import { CopyAction } from '../Miscellaneous/CopyAction'
import { factoryAbi, factoryAddress } from '@/constants/ChallengeFactoryInfo'

import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { Address, isAddressEqual, parseAbiItem, parseEther } from 'viem'
import { publicClient } from '@/utils/client'
import { fromBlock } from '@/constants/ChallengeInfo'
import { _toLowerCase } from 'zod/v4/core'
import { Button } from '@/components/ui/button'




const ChallengeFactory = () => {

    const {address} = useAccount()

    const { data: hash, isPending: isPending, writeContract } = useWriteContract({
        mutation: {
            onError: (err) => {
                if(err.message.toLowerCase().includes("user rejected the request")){
                    toast.error("Error : User rejected the request", {
                        duration: 3000,
                    });
                    return
                }
                toast.error("Creation failed: " + err.message, {
                    duration: 3000,
                })
            },
        },
    })

    //Used to check the current transaction state
    const { isLoading: isConfirming, isSuccess, error: errorConfirmation, } = useWaitForTransactionReceipt({
        hash
    })


    const handleCreateChallenge = (data: ChallengeFormValues) => {
        console.log('Creating new challenge', data);
        
        const duration = BigInt(data.duration);
        const maxPlayers = BigInt(data.maxPlayers);
        const bid = parseEther(data.bid);
        const description = data.description;
        const isGroup = data.isGroup;
        const groupAddresses = data.groupAddresses.map((elem: { address: any }) => elem.address);

        writeContract({
            address: factoryAddress,
            abi: factoryAbi,
            functionName: 'createChallenge',
            args: [duration, maxPlayers, bid, description, isGroup, groupAddresses],
        })
    }



    const getChallengeEndedEvents = async() => {
    
        //Get the latest block - 100, to only get the few last blocks
        const latest = await publicClient.getBlockNumber();
        const from = latest > 100n ? latest - 100n : 0n;

        const Logs = await publicClient.getLogs({
            address: factoryAddress,
            event: parseAbiItem("event ChallengeCreated(address indexed admin, address challengeAddress, uint256 blockNumber)"),
            fromBlock: from,
            toBlock: 'latest'
        })
        console.log("New Challenge creation event!", Logs)
        if (Logs.length === 0) {
            console.error("No recently created challenge has been found")
            return null;
        }else{
              // Loop through logs in reverse to find latest match
            for (let i = Logs.length - 1; i >= 0; i--) {
                const log = Logs[i];
                const logAdmin = log.args?.admin;
                const challengeAddress = log.args?.challengeAddress;

                if (logAdmin && address && isAddressEqual(logAdmin, address)) {
                    console.log("Latest challenge created by user:", challengeAddress);
                    return challengeAddress;
                }
            }

            console.error("No challenge found created by current user");
            return null;
        }
    }


    useEffect(() => {
        if(isSuccess) {
            getChallengeEndedEvents().then((challengeAddress) => {
                if(challengeAddress == null){
                    toast.warning("Warning!", {
                        description: "Challenge successfully created, but could not retrieve contract address. Check 'My challenges' tab",
                    })
                }else{
                    toast.info("Transaction Successful!", {
                        description: "Challenge créé avec succes a l'adresse " + challengeAddress,
                        action:<CopyAction address={challengeAddress}/>,
                        duration: 6000,
                    })
                }
            })
        }
        if(errorConfirmation) {
            if(errorConfirmation.message.toLowerCase().includes("user rejected the request")){
                toast.error("Error : User rejected the request", {
                    duration: 3000,
                });
                return
            }
            toast.error(errorConfirmation.message, {
                duration: 3000,
            });
        }
    }, [isSuccess, errorConfirmation])



    return (
        <div className='flex-center flex-col gap-10 '>
            <div className='text-3xl font-bold'>Crée un nouveau challenge et invite tes amis !</div>

            <ChallengeForm onSubmit={handleCreateChallenge} />
        </div>
    )
}

export default ChallengeFactory