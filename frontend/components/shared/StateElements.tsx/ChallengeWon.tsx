import { fromBlock } from '@/constants/ChallengeInfo'
import { publicClient } from '@/utils/client'
import { log } from 'console'
import React, { useContext, useEffect, useState } from 'react'
import { Address, formatEther, parseAbiItem, } from 'viem'
import { useAccount } from 'wagmi'
import { ContractAddressContext } from '../RouteBaseElements/ChallengePage'
import { Trophy } from 'lucide-react'

const ChallengeWon = () => {

  const {address} = useAccount()

  const contractAddress = useContext(ContractAddressContext)

  type Winner = {
    winnerAddress : Address,
    prizeReceived : bigint
  }

  //Events
  const [winners, setWinners] = useState<Winner[]>([])

  const getWinnersEvents = async() => {

      const Logs = await publicClient.getLogs({
          address: contractAddress,
          event: parseAbiItem("event PrizeSent(address winnerAddress, uint256 prizeShare)"),
          // du premier bloc
          fromBlock: BigInt(fromBlock),
          // jusqu'au dernier
          toBlock: 'latest' // Pas besoin valeur par défaut
      })
      console.log("getPrizeEvents : ", Logs)

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
        {/* <div className='p-10 flex flex-center flex-col gap-10 text-2xl'>
            <h1>🎉 The vote has concluded. A winner has been declared!</h1>
            {winners.length > 0 && (
              <div>
                {winners.length === 1 ? (
                  <>
                    <div>Winner : {winners[0].winnerAddress}</div>
                  </>
                ) : (
                  <div className='flex flex-center flex-col'>
                    <div className='mb-3'>Winners :</div>
                    {winners.map((winner, index) => (
                      <div key={index}>{winner.winnerAddress}</div>
                    ))}
                  </div>
                )}
                <div className='flex-center mt-3'>Received a prize of {formatEther(winners[0].prizeReceived)} DARE!</div>
              </div>
            )}
        </div> */}
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