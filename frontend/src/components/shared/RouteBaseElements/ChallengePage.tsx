'use client'
import { createContext, useEffect, useState } from "react"
import { StickyNote } from 'lucide-react'

import { useAccount, useReadContracts } from "wagmi"
import { Address, formatEther } from "viem"

import { contractAbi } from "@/constants/ChallengeInfo"
import ChallengeState from "../ChallengeState"


export const BidContext = createContext<bigint>(0n);
export const DurationContext = createContext<bigint>(0n);

export const ContractAddressContext = createContext<Address>("0x0000000000000000000000000000000000000000");

const ChallengePage = ({contractAddress} : {contractAddress : Address}) => {


/***************** 
 * Functions for interaction with the blokchain 
 * **************/

  const {address} = useAccount()

  // Used to read the contract current state
  const { data: readData, error: error, isPending: IsPending, refetch: refetch } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'description',
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'bid',
      },
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'duration',
      },
    ],
    account: address as `0x${string}` | undefined
  })

  /********
   * Other
   *********/
  const [bid, setBid] = useState<bigint>(0n)
  const [description, setDescription] = useState<string>("")
  const [duration, setDuration] = useState<bigint>(0n)
  
  // Convert unknown to safe string
  const displayDesc = (() => {
    if (IsPending) return 'Loading…';
    if (error) return 'Error fetching description';

    const desc = description;

    return desc;
  })()

  const displayBid = (() => {
    if (IsPending) return 'Loading…';
    if (error) return 'Error fetching description';

    return formatEther(bid)
  })()

  const displayDuration = (() => {
    if (IsPending) return 'Loading…';
    if (error) return 'Error fetching description';

    const durationAsNumber = Number(duration)
    const hours = Math.floor(durationAsNumber / 3600);
    const minutes = Math.floor((durationAsNumber % 3600) / 60);
    const seconds = durationAsNumber % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(" ");
  })()

  
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(contractAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }



  /******
   * UseEffect**
   * */

  useEffect(() => {
    if (!readData) {
        refetch()
        return
    }

    // description
    const d = readData[0].result
    setDescription(typeof d === 'string' ? d : JSON.stringify(d))

    // bid
    const b = readData[1].result
    setBid(typeof b === 'bigint' ? b : 0n)

    // duration
    const dur = readData[2].result
    setDuration(dur as bigint)
  }, [readData, address])





/********* DISPLAY **********/
  return (
    <main className="flex flex-col min-h-screen text-white">
      
      {/* Section infos challenge */}
      <div className="flex items-center justify-between p-6 m-4 bg-[#1F243A] border border-white/10 rounded-2xl shadow-lg">
        {/* Titre */}
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Challenge : <span className="text-cyan-400">{displayDesc}</span>
          </h1>
          <button
            onClick={handleCopy}
            className="p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Copier l'adresse du contrat"
          >
            <div className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-white/70" />
              {copied ? (
                <span className="text-sm text-green-400 animate-fade-in">
                  Copié !
                </span>
                ) : (<span className="text-white/50">copier CA</span>)}
            </div>
            
          </button>
          
        </div>
        
        {/* Stats */}
        <div className="flex space-x-8 text-sm md:text-base">
          <div className="flex flex-col">
            <span className="text-white/60 uppercase tracking-wide">Mise</span>
            <span className="font-semibold text-cyan-400">{displayBid} DARE</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white/60 uppercase tracking-wide">Durée</span>
            <span className="font-semibold text-white">{displayDuration}</span>
          </div>
        </div>
      </div>

      {/* Conteneur principal */}
      <div className="flex-1 p-4 m-4 bg-[#1A1F33] border border-white/10 rounded-2xl shadow-inner overflow-auto">
        <ContractAddressContext value={contractAddress}>
          <BidContext value={bid}>
            <DurationContext value={duration}>
              <ChallengeState />
            </DurationContext>
          </BidContext>
        </ContractAddressContext>
      </div>
    </main>
    
  )
}

export default ChallengePage