'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export function CurrentTransactionToast({ isConfirming, isSuccess, successMessage, txHash }: { isConfirming: boolean; isSuccess: boolean, successMessage: string, txHash: `0x${string}`| undefined }) {

  useEffect(() => {
    let transactionHash;
    if(txHash === undefined){
      transactionHash = "-"
    } else {
      transactionHash = txHash
    }

    if (isConfirming) {
        // display toast "loading" and set ID
        toast.info('Pending...', {
            id: 1,
            description: <div><div>Transaction in progress...</div><div>Tx hash : {transactionHash}</div></div>,
        })
    }
    if (isSuccess) {
        // Remplace toast "loading" by toast success with same ID
        toast.success("Transaction Successful!", {
            id: 1,
            description: <div><div>{successMessage}</div><div>Tx hash : {transactionHash}</div></div>,
            duration: 5000,
        })
    }

  }, [isConfirming, isSuccess])

  return null
}
