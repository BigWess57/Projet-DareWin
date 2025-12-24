"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function CurrentTransactionToast({
    isConfirming,
    isSuccess,
    successMessage,
    txHash,
}: {
    isConfirming: boolean;
    isSuccess: boolean;
    successMessage: string;
    txHash: `0x${string}` | undefined;
}) {
    const t = useTranslations("CurrentTransaction");

    useEffect(() => {
        // Safe check for display
        const displayHash = txHash || "-";

        // Use a consistent ID.
        // If txHash exists, use it. If not (unlikely in confirming), use a fallback string.
        // This ensures this toast is unique to THIS specific transaction.
        const toastId = txHash || "current-tx-toast";

        if (isConfirming) {
            // display toast "loading" and set ID
            toast.info(t("transaction_pending"), {
                id: toastId,
                description: (
                    <div>
                        <div>{t("transaction_in_progress")}</div>
                        <div>Tx hash : {displayHash}</div>
                    </div>
                ),
            });
        }
        if (isSuccess) {
            // Remplace toast "loading" by toast success with same ID
            toast.success(t("transaction_successful"), {
                id: toastId,
                description: (
                    <div>
                        <div>{successMessage}</div>
                        <div>Tx hash : {displayHash}</div>
                    </div>
                ),
                duration: 5000,
            });
        }
    }, [isConfirming, isSuccess, successMessage, t, txHash]);

    return null;
}
