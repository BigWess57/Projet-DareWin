import React, { useContext, useEffect, useState } from 'react'

import { Address, formatEther } from 'viem'
import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { ContractAddressContext } from '../RouteBaseElements/ChallengePage'

import { contractAbi } from '@/constants/ChallengeInfo'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'


const ChallengeWon = () => {

  const {address} = useAccount()

  const [numberOfWinners, setNumberOfWinners] = useState<number>(0)
  const [prize, setPrize] = useState<bigint>(0n)
  const [hasJoined, setHasJoined] = useState<boolean>(false)
  const [hasWithdrawn, setHasWithdrawn] = useState<boolean>(false)
  const [isWinner, setIsWinner] = useState<boolean>(false)

  const contractAddress = useContext(ContractAddressContext)

  const { data: readData, error: error, isPending: IsPending, refetch: refetch } = useReadContracts({
    contracts: [
        {
            address: contractAddress,
            abi: contractAbi,
            functionName: 'highestVotes',
        },
        {
            address: contractAddress,
            abi: contractAbi,
            functionName: 'numberOfWinners',
        },
        {
            address: contractAddress,
            abi: contractAbi,
            functionName: 'prizePerWinner',
        },
        {
            address: contractAddress,
            abi: contractAbi,
            functionName: 'players',
            args: [address as Address],
        },
    ],
    account: address as `0x${string}` | undefined
  })

  const { data: hash, isPending, writeContract, } = useWriteContract({
      mutation: {
          onError: (err) => {
              if(err.message.toLowerCase().includes("user rejected")){
                  toast.error("withdraw prize failed: Use rejected the request")
              }else{
                  toast.error("withdraw prize failed: " + err.message)
              }
          },
      },
  })

  //Used to check the current transaction state
  const { isLoading, isSuccess, error: withdrawReceiptError, } = useWaitForTransactionReceipt({
      hash
  }) 


  const withdrawPrize = async () => {
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'withdrawPrize',
      account: address as `0x${string}`,
    })
  }

/********* useEffects ***********/
  useEffect(() => {
    // getWinnersEvents()
    if(!readData) return;

    // highest votes
    const highestVotes = readData[0].result

    // number of winners
    const nbWinners = readData[1].result
    setNumberOfWinners(nbWinners as number)

    // prize per winner
    const prize = readData[2].result
    setPrize(prize as bigint)

    // current connected player
    const player = readData[3].result
    if (player == undefined || highestVotes == undefined){
      toast.error("Error : Could not retrieve player info from contract", {
          duration: 3000,
      });
      return;
    }

    //store if player has joined the challenge
    const hasJoined = player[0]
    setHasJoined(hasJoined)

    //Store if he has withdrawn his prize
    const hasWithdrawn = player[2]
    setHasWithdrawn(hasWithdrawn)

    //Check if he is a winner
    const currentVotecount = player[3]

    if(currentVotecount == highestVotes){
      setIsWinner(true);
      return
    }
    setIsWinner(false);

  }, [readData, address])


  //For start challenge
  useEffect(() => {
      if(isSuccess) {
        toast.success("Succès", {
          description: "Vous avez récupéré votre récompense",
        })

        setHasWithdrawn(true);

        // Refetch after delay as backup
        const timer = setTimeout(() => {
            refetch()
        }, 2000)
        return () => clearTimeout(timer)
      }
      if(withdrawReceiptError) {
          console.error('Transaction failed ', withdrawReceiptError.message)
          toast.error("Error : Could not withdraw prize", {
              duration: 3000,
          });
      }
  }, [isSuccess, withdrawReceiptError])


  return (
    <>
      <div className="
        p-10 bg-gradient-to-br from-[#1F243A] to-[#151A2A]
        border border-white/10 rounded-2xl shadow-xl
        text-white flex flex-col items-center space-y-6
      ">
        {/* Titre */}
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          Le vote est terminé !
        </h1>
        <div className="w-full max-w-md space-y-6 text-center">
          {!hasJoined ? (
            <div className="text-lg italic text-white/80">
              Vous ne participez pas à ce défi
            </div>
          ) : isWinner ? (
            <div className="space-y-3">
              <div className="text-xl font-semibold text-green-400">🎉 Vous avez gagné !</div>
              <div className="text-lg text-white/80">
                Votre Récompense :
                <span className="ml-2 font-semibold text-yellow-300">
                  {formatEther(prize)} DARE
                </span>
              </div>
              <Button
                disabled={hasWithdrawn}
                onClick={withdrawPrize}
                className={`
                  w-full text-lg font-semibold rounded-xl px-4 py-3
                  ${hasWithdrawn 
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed" 
                    : "bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-500 shadow-lg hover:from-indigo-400 hover:via-purple-500 hover:to-blue-400 hover:scale-105 transition-all duration-200"}
                `}
              >
                {hasWithdrawn
                  ? "Vous avez déjà récupéré votre récompense"
                  : "Récupérer votre récompense"}
              </Button>
            </div>
          ) : (
            <div className="text-xl text-red-400 font-semibold">Vous avez perdu ...</div>
          )}

          <div className="text-lg text-white/80">
            {numberOfWinners > 1
              ? `${numberOfWinners} joueurs ont gagné ce défi et remportent `
              : `${numberOfWinners} joueur a gagné ce défi et remporte `}
            <span className="font-semibold text-yellow-300">
              {formatEther(prize)} DARE
            </span>
            !
          </div>
        </div>
      </div>
    </>
  )
}

export default ChallengeWon