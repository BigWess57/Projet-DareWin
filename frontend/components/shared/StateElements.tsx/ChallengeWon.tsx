import React, { useContext, useEffect, useState } from 'react'

import { Address, formatEther, GetLogsReturnType, parseAbiItem, } from 'viem'
import { useAccount } from 'wagmi'

import { ContractAddressContext } from '../RouteBaseElements/ChallengePage'
import { retriveEventsFromBlock } from '@/utils/client'

import { Trophy } from 'lucide-react'


const ChallengeWon = () => {

  const {address} = useAccount()

  const contractAddress = useContext(ContractAddressContext)

  type Winner = {
    winnerAddress : Address,
    prizeReceived : bigint
  }

  //ABI types for events
  const PRIZE_SENT_ABI = parseAbiItem(
      "event PrizeSent(address winnerAddress, uint256 prizeShare)"
  );

  //Events
  const [winners, setWinners] = useState<Winner[]>([])

  const getWinnersEvents = async() => {

      const Logs = await retriveEventsFromBlock(contractAddress, "event PrizeSent(address winnerAddress, uint256 prizeShare)") as GetLogsReturnType<typeof PRIZE_SENT_ABI>

      const winnersToStore = Logs.map(log => ({
        winnerAddress: log.args.winnerAddress || "0x",
        prizeReceived: log.args.prizeShare || 0n
      }))

      setWinners(winnersToStore)
  }

  useEffect(() => {
    getWinnersEvents()
  }, [address])

  return (
    <>
      <div className="
        p-10 bg-gradient-to-br from-[#1F243A] to-[#151A2A] 
        border border-white/10 rounded-2xl shadow-xl 
        text-white flex flex-col items-center space-y-6
      ">
        {/* Titre */}
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          🎉 Le vote est terminé !
        </h1>

        {/* Message et liste des gagnants */}
        {winners.length > 0 && (
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
        )}
      </div>
    </>
  )
}

export default ChallengeWon