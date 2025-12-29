import {
    tokenAddress,
    uniswapV2RouterAddress,
    wethAddress,
} from "@/config/networks";
import { tokenAbi, uniswapV2Router02_Abi } from "@/constants/TokenInfo";
import { config } from "@/src/app/RainbowKitAndWagmiProvider";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { parseEther } from "viem";
import {
    useAccount,
    useWaitForTransactionReceipt,
    useWriteContract,
} from "wagmi";
import {
    readContract,
    waitForTransactionReceipt,
    writeContract,
} from "wagmi/actions";

type UseSwapTransactionProps = {
    cleanupDisplay: () => void;
    payAmount: string;
    isInsufficientBalance: boolean;
    isEthToDare: boolean;
    receiveAmount: string;
    slippage: number;
    onSwapSuccess: () => void;
};

export default function useSwapTransaction({
    cleanupDisplay,
    payAmount,
    isInsufficientBalance,
    isEthToDare,
    receiveAmount,
    slippage,
    onSwapSuccess,
}: UseSwapTransactionProps) {
    const t = useTranslations("HomePage.Swap");
    const { address, isConnected } = useAccount();
    // --- BLOCKCHAIN FUNCTIONS ---

    //Swap
    const { data: hash, writeContract: swapContract } = useWriteContract({
        mutation: {
            onError: (err) => {
                if (
                    err.message
                        .toLowerCase()
                        .includes("user rejected the request")
                ) {
                    toast.info(t("swap_failed"), {
                        id: 1,
                        description: t("user_rejected"),
                    });
                } else {
                    toast.error(t("swap_failed"), {
                        id: 1,
                        description: err.message,
                    });
                }
                setIsSwapping(false);
                cleanupDisplay();
            },
        },
    });

    //Used to check the current transaction state of the swap
    const {
        isLoading: swapConfirming,
        isSuccess: swapSuccess,
        error: swapReceiptError,
    } = useWaitForTransactionReceipt({
        hash: hash,
    });

    // --- COMPONENT STATE ---
    const [isSwapping, setIsSwapping] = useState(false);

    // --- FUNCTIONS ---
    // Swap Function
    const handleSwap = async () => {
        if (!payAmount || isInsufficientBalance || !isConnected || !address)
            return;
        setIsSwapping(true);

        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes from now

        // Convert input to BigInt Wei
        const amountIn = parseEther(payAmount);

        // Calculate Minimum Output (Based on Slippage Tolerance)
        const slippageMultiplier = BigInt(
            Math.floor((1 - slippage / 100) * 10000),
        );
        const rawAmountOut = parseEther(receiveAmount);
        const amountOutMin =
            (rawAmountOut * BigInt(slippageMultiplier)) / BigInt(10000);

        if (isEthToDare) {
            // --- ETH -> DARE ---
            console.log(
                "Swapping",
                payAmount,
                "ETH for",
                receiveAmount,
                " DARE",
            );
            swapContract({
                address: uniswapV2RouterAddress,
                abi: uniswapV2Router02_Abi,
                functionName: "swapExactETHForTokens",
                account: address as `0x${string}`,
                args: [
                    amountOutMin, // Min amount of DARE to receive
                    [wethAddress, tokenAddress], // Path: WETH -> DARE
                    address, // Recipient
                    deadline, // Transaction deadline
                ],
                value: amountIn,
            });
        } else {
            console.log(
                "Swapping",
                payAmount,
                "DARE for",
                receiveAmount,
                " ETH",
            );

            let txHash: `0x${string}` = "0x";
            try {
                //get allowance for UniswapV2Router to spend users DARE Tokens
                const allowance = await readContract(config, {
                    address: tokenAddress,
                    abi: tokenAbi,
                    functionName: "allowance",
                    args: [address, uniswapV2RouterAddress],
                });

                //Check if allowance has already been set
                if ((allowance as bigint) < amountIn) {
                    //Approve the use of needed amount of tokens
                    txHash = await writeContract(config, {
                        address: tokenAddress,
                        abi: tokenAbi,
                        functionName: "approve",
                        args: [uniswapV2RouterAddress, amountIn],
                        account: address as `0x${string}`,
                    });
                    toast.info(t("pending"), {
                        id: 1,
                        description: (
                            <div>
                                <div>Approving tokens...</div>
                                <div>Tx hash : {txHash}</div>
                            </div>
                        ),
                        action: null,
                    });

                    //Wait for approval of transaction
                    await waitForTransactionReceipt(config, {
                        hash: txHash,
                        confirmations: 1,
                    });

                    toast.success(t("transaction_success"), {
                        id: 1,
                        description: (
                            <div>
                                <div>Tokens Approved!</div>
                                <div>Tx hash : {txHash}</div>
                            </div>
                        ),
                        duration: 3000,
                    });
                }

                //Initiate swap
                txHash = await writeContract(config, {
                    address: uniswapV2RouterAddress,
                    abi: uniswapV2Router02_Abi,
                    functionName: "swapExactTokensForETH",
                    args: [
                        amountIn,
                        amountOutMin,
                        [tokenAddress, wethAddress],
                        address,
                        deadline,
                    ],
                });

                toast.info(t("pending"), {
                    id: 2,
                    description: (
                        <div>
                            <div>Swapping tokens...</div>
                            <div>Tx hash : {txHash}</div>
                        </div>
                    ),
                });

                await waitForTransactionReceipt(config, {
                    hash: txHash,
                    confirmations: 1,
                });

                toast.success(t("transaction_success"), {
                    id: 2,
                    description: (
                        <div>
                            <div>{t("swap_success")}</div>
                            <div>Tx hash : {txHash}</div>
                        </div>
                    ),
                    duration: 3000,
                });
            } catch (err) {
                if (
                    err instanceof Error &&
                    err.message
                        ?.toLowerCase()
                        .includes("user rejected the request")
                ) {
                    toast.info(t("user_rejected"), {
                        duration: 3000,
                    });
                    return;
                }

                console.error("Transaction failed ", err);
                toast.dismiss();
                toast.error("Error", {
                    duration: 3000,
                    description: (
                        <div>
                            <div>
                                Could not swap tokens. (see console for more
                                details)
                            </div>
                            <div>Tx hash : {txHash}</div>
                        </div>
                    ),
                });
            } finally {
                setIsSwapping(false);
                cleanupDisplay();
            }
        }
    };

    //For swapping
    useEffect(() => {
        if (swapSuccess) {
            onSwapSuccess();
            setIsSwapping(false);
            cleanupDisplay();
        }
        if (swapReceiptError) {
            console.error("Transaction failed ", swapReceiptError.message);
            toast.error(t("error_while_swapping"), {
                duration: 3000,
            });
            setIsSwapping(false);
            cleanupDisplay();
        }
    }, [swapSuccess, swapReceiptError, t, onSwapSuccess, cleanupDisplay]);

    return { isSwapping, swapConfirming, swapSuccess, hash, handleSwap };
}
