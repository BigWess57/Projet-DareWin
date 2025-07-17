import { fromBlock } from '@/constants/ChallengeInfo'
import { publicClient } from '@/utils/client'
import { log } from 'console'
import React, { useContext, useEffect, useState } from 'react'
import { Address, formatEther, parseAbiItem, } from 'viem'
import { useAccount } from 'wagmi'
import { ContractAddressContext } from '../ChallengePage'

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
        <div className='p-10 flex flex-center flex-col gap-10 text-2xl'>
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
            
        </div>
    </>
  )
}

export default ChallengeWon