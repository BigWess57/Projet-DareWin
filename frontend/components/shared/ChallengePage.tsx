import React, { createContext, useEffect } from 'react'

import Challenge from './Challenge'

import { useAccount, useReadContract } from 'wagmi'
import { tokenAbi, tokenAddress } from '@/constants/TokenInfo'
import { Address, formatEther } from 'viem'


export const ContractAddressContext = createContext<Address>("0x0000000000000000000000000000000000000000");

const ChallengePage = ({contractAddress} : {contractAddress : Address}) => {

    const {address} = useAccount()

    const { data: balance, error: error, isPending: IsPending, refetch: refetch } = useReadContract({
        address: tokenAddress,
        abi: tokenAbi,
        functionName: 'balanceOf',
        args: [address],
        account: address as `0x${string}` | undefined
    })

    const displayBalance = (() => {
        if (IsPending) return 'Loading…';
        if (error) return 'Error fetching description';

        
        return typeof balance === 'bigint' ? formatEther(balance) : "ERROR FETCHING BALANCE"
    })()


    useEffect(() => {
        refetch();
    }, [address])

    return (
        <div>
            <div className='pb-5 flex justify-end'>DARE Balance : <span className='font-bold ml-1'>{displayBalance}</span></div>
            <ContractAddressContext value={contractAddress}>
                <Challenge/>
            </ContractAddressContext>
        </div>
    )
}

export default ChallengePage