import React, { useContext, useEffect, useState } from 'react'

import { Address, formatEther, GetLogsReturnType, parseAbiItem, parseEther, } from 'viem'
import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { ContractAddressContext } from '../RouteBaseElements/ChallengePage'
import { retriveEventsFromBlock } from '@/utils/client'

import { Trophy } from 'lucide-react'
import { contractAbi } from '@/constants/ChallengeInfo'
import { Playwrite_ES } from 'next/font/google'
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
            functionName: 'Players',
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

  // type Winner = {
  //   winnerAddress : Address,
  //   prizeReceived : bigint
  // }

  //ABI types for events
  // const PRIZE_SENT_ABI = parseAbiItem(
  //     "event PrizeSent(address winnerAddress, uint256 prizeShare)"
  // );

  // //Events
  // const [winners, setWinners] = useState<Winner[]>([])

  // const getWinnersEvents = async() => {

  //     const Logs = await retriveEventsFromBlock(contractAddress, "event PrizeSent(address winnerAddress, uint256 prizeShare)") as GetLogsReturnType<typeof PRIZE_SENT_ABI>

  //     const winnersToStore = Logs.map(log => ({
  //       winnerAddress: log.args.winnerAddress || "0x",
  //       prizeReceived: log.args.prizeShare || 0n
  //     }))

  //     setWinners(winnersToStore)
  // }

  const withdrawPrize = async () => {
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'withdrawPrize',
      account: address as `0x${string}`,
    })
  }



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

    if(currentVotecount == BigInt(highestVotes)){
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
          // className: "bg-lime-200"
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
        {/* {!hasJoined ?
          (<div>
            <div className='italic'> Vous ne participez pas a ce défi </div>
          </div>)
          :
          (isWinner ?
            <div>
              <div> Vous avez gagné ! </div>
              <div> Votre Récompense : {formatEther(prize)} DARE </div>
              <Button disabled={hasWithdrawn} onClick={withdrawPrize}> {hasWithdrawn ? "Vous avez déja retiré votre récompense" : "Retirer votre récompense"}</Button>
            </div>
            :
            <div>
              <div> Vous avez perdu ... </div>
            </div>
          )
        }
        <div>
          <div>{numberOfWinners} joueurs ont gagné ce défi et remporté {formatEther(prize)} DARE !</div>
        </div> */}
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


        {/* Message et liste des gagnants */}
        {/* {winners.length > 0 && (
          <div className="w-full max-w-md space-y-4 text-center">
            {winners.length === 1 ? (
              <div className="space-y-2">
                <div className="flex items-center text-lg">
                  <div>Gagnant :</div>
                  <div><Trophy className="ml-3 w-5 h-5 text-yellow-400" /></div>
                  <span className="ml-2 font-mono font-semibold text-cyan-400">
                    {winners[0].winnerAddress}
                  </span>
                </div>
                <div className="text-white/80">
                  Prix reçu :
                  <span className="ml-2 font-semibold text-yellow-300">
                    {formatEther(winners[0].prizeReceived)} DARE
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-lg font-semibold">Gagnants :</div>
                <ul className="space-y-1">
                  {winners.map((winner, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-center gap-2 text-white"
                    >
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <span className="font-mono">{winner.winnerAddress}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-white/80">
                  Chaque joueur reçoit :
                  <span className="ml-2 font-semibold text-yellow-300">
                    {formatEther(winners[0].prizeReceived)} DARE
                  </span>
                </div>
              </div>
            )}
          </div>
        )} */}
      </div>
    </>
  )
}

export default ChallengeWon