'use client'
import { z } from 'zod'

import { useWaitForTransactionReceipt, useWriteContract } from "wagmi"

import ChallengeForm from "./Miscellaneous/ChallengForm"
import { factoryAbi, factoryAddress } from '@/constants/ChallengeFactoryInfo'

import { toast } from 'sonner'
import { useEffect } from 'react'




export const formSchema = z.object({
  duration: z.coerce.number().min(1),
  maxPlayers: z.coerce.number().min(1),
  bid: z.string().regex(/^\d+(\.\d+)?$/, 'Must be a valid number'),
  description: z.string().min(5),
})

export type ChallengeFormValues = z.infer<typeof formSchema>


const ChallengeFactory = () => {

    const { data: hash, isPending: isPending, writeContract } = useWriteContract({
        mutation: {
            onError: (err) => toast.error("Vote failed: " + err.message),
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
        const bid = BigInt(data.bid);
        const description = data.description;

        writeContract({
            address: factoryAddress,
            abi: factoryAbi,
            functionName: 'createChallenge',
            args: [duration, maxPlayers, bid, description, false, []],
        })
    }


    // Events
    



    useEffect(() => {
        if(isSuccess) {
            toast.success("Success!", {
                description: "Challenge successfully created",
            })
        }
        if(errorConfirmation) {
            toast.error(errorConfirmation.message, {
                duration: 3000,
            });
        }
    }, [isSuccess, errorConfirmation])



    return (
        <div className='flex-center flex-col gap-10 '>
            <div className='text-3xl'>Create a new challenge and invite your friends !</div>

            <ChallengeForm onSubmit={handleCreateChallenge} />
        </div>
    )
}

export default ChallengeFactory