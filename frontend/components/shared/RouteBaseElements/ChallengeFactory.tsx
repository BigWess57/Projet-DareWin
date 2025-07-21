'use client'

import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi"

import ChallengeForm, { ChallengeFormValues } from "../Miscellaneous/ChallengeForm"
import { CopyAction } from '../Miscellaneous/CopyAction'
import { factoryAbi, factoryAddress } from '@/constants/ChallengeFactoryInfo'

import { toast } from 'sonner'
import { useEffect } from 'react'
import { isAddressEqual, parseAbiItem, parseEther } from 'viem'
import { publicClient } from '@/utils/client'
import { _toLowerCase } from 'zod/v4/core'




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
        
        const duration = data.duration;
        const maxPlayers = data.maxPlayers;
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
        
        const latestBlockNumber = await publicClient.getBlockNumber();
        const block500Before = latestBlockNumber > 499n ? latestBlockNumber - 499n : 0n;

        const Logs = await publicClient.getLogs({
            address: factoryAddress,
            event: parseAbiItem("event ChallengeCreated(address indexed admin, address challengeAddress, uint256 blockNumber)"),
            fromBlock: block500Before,
            toBlock: 'latest'
        })
        
        if (Logs.length === 0) {
            console.log("No recently created challenge has been found")
            return null;
        }else{
              // Loop through logs in reverse to find latest match
            for (let i = Logs.length - 1; i >= 0; i--) {
                const log = Logs[i];
                const logAdmin = log.args?.admin;
                const challengeAddress = log.args?.challengeAddress;

                if (logAdmin && address && isAddressEqual(logAdmin, address)) {
                    return challengeAddress;
                }
            }

            console.log("No challenge found created by current user");
            return null;
        }
    }

    useEffect(() => {
        if (isConfirming) {
            // Affiche le toast "loading" et garde son ID
            toast.loading('Pending...', {
                id: 1,
                description: 'Creating Challenge...',
                action: null,
            })
        }
        if (isSuccess) {
            // Remplace toast "loading" by toast success with same ID
            getChallengeEndedEvents().then((challengeAddress) => {
                if(challengeAddress == null){
                    toast.warning("Warning!", {
                        id: 1,
                        description: "Challenge successfully created, but could not retrieve contract address. Check 'My challenges' tab",
                        duration: 3000,
                    })
                }else{
                    toast.success("Transaction Successful!", {
                        id: 1,
                        description: "Challenge créé avec succes a l'adresse " + challengeAddress,
                        action:<CopyAction address={challengeAddress}/>,
                        duration: 5000,
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
    }, [isSuccess, isConfirming,  errorConfirmation])



    return (
        <div className='flex-center flex-col gap-10 '>
            <div className='text-3xl font-bold'>Crée un nouveau challenge et invite tes amis !</div>

            <ChallengeForm onSubmit={handleCreateChallenge} />
        </div>
        
    )
}

export default ChallengeFactory