'use client'
import { createContext, ReactNode, useContext, useEffect, useState } from "react"

import { useAccount, useReadContract, useReadContracts } from "wagmi"
import { Abi, Account, Address, formatEther, numberToBytes } from "viem"

import { contractAbi } from "@/constants/ChallengeInfo"
import ChallengeState from "./ChallengeState"


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

    // console.log(readData[0].result)
    const description = readData[0].result;
    // if (typeof description === 'string'){ 
    //   return description;
    // }
    // return JSON.stringify(description)
    return description;
  })()

  const displayBid = (() => {
    if (IsPending) return 'Loading…';
    if (error) return 'Error fetching description';

    // console.log(readData[1].result)
    // const bid = readData[1].result;
    // if (typeof bid === 'bigint'){
    //   return formatEther(bid);
    // } 
    // return JSON.stringify(Number(bid))
    return formatEther(bid)
  })()

  const displayDuration = (() => {
    if (IsPending) return 'Loading…';
    if (error) return 'Error fetching description';

    // console.log(readData[2].result)
    // const duration = readData[2].result;
    // if (typeof duration === 'bigint') {
    //   return duration;
    // }
    // return JSON.stringify(Number(duration))
    return duration;
  })()

  

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
    <>
      <div className="flex-between m-4">
        <div className="text-3xl gap-2">
          Challenge : <span className="font-bold">{displayDesc as ReactNode}</span>
        </div>
        <div>
          <div>
            bid : <span className="font-bold">{displayBid} DARE</span>
          </div>
          <div>
            duration : <span className="font-bold">{displayDuration} s</span>
          </div>
        </div>
      </div>

      <div className="m-4 mt-10">
        <ContractAddressContext value={contractAddress}>
          <BidContext value={bid}>
            <DurationContext value={duration}>
              <ChallengeState/>
            </DurationContext>
          </BidContext>
        </ContractAddressContext>
      </div>
    </>
    
  )
}

export default ChallengePage