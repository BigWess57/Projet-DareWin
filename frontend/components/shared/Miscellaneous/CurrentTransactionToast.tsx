'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export function CurrentTransactionToast({ isConfirming, isSuccess, successMessage }: { isConfirming: boolean; isSuccess: boolean, successMessage: string }) {

  useEffect(() => {
    if (isConfirming) {
        // display toast "loading" and set ID
        toast.loading('Pending...', {
            id: 1,
            description: 'Transaction in progress...',
        })
    }
    if (isSuccess) {
        // Remplace toast "loading" by toast success with same ID
        toast.success("Transaction Successful!", {
            id: 1,
            description: successMessage,
            duration: 5000,
        })
    }

  }, [isConfirming, isSuccess])

  return null
}
