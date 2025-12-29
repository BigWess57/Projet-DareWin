import {
    tokenAddress,
    uniswapV2RouterAddress,
    wethAddress,
} from "@/config/networks";
import { uniswapV2Router02_Abi } from "@/constants/TokenInfo";
import { config } from "@/src/app/RainbowKitAndWagmiProvider";
import { useTranslations } from "next-intl";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { readContract } from "wagmi/actions";

type Balance = {
    decimals: number;
    formatted: string;
    symbol: string;
    value: bigint;
};
type UseSwapQuoteProps = {
    isEthToDare: boolean;
    ethBalance: Balance | undefined;
    dareBalance: Balance | undefined;
    activePayTokenBalance: Balance | undefined;
    activePayTokenSymbol: string;
    payAmount: string;
    setPayAmount: Dispatch<SetStateAction<string>>;
    receiveAmount: string;
    setReceiveAmount: Dispatch<SetStateAction<string>>;
    setIsInsufficientBalance: Dispatch<SetStateAction<boolean>>;
    setQuoteError: Dispatch<SetStateAction<string | null>>;
};

export default function useSwapQuote({
    isEthToDare,
    ethBalance,
    dareBalance,
    activePayTokenBalance,
    activePayTokenSymbol,
    payAmount,
    setPayAmount,
    receiveAmount,
    setReceiveAmount,
    setIsInsufficientBalance,
    setQuoteError,
}: UseSwapQuoteProps) {
    const t = useTranslations("HomePage.Swap");
    // Track which input is driving the calculation to prevent loops
    const [activeField, setActiveField] = useState<"PAY" | "RECEIVE">("PAY");

    // State for quote fetching
    const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);

    // Handle Input Changes
    const handlePayChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const maxBalance = activePayTokenBalance
            ? parseFloat(activePayTokenBalance.formatted)
            : 0;

        // STRICT VALIDATION: Only allow numbers and a single decimal point
        // Regex breakdown: ^ start, \d* digits (optional), \.? optional dot, \d* digits (optional), $ end
        if (val === "" || /^\d*\.?\d*$/.test(val)) {
            setPayAmount(val);
            setActiveField("PAY"); // Mark Pay as the active field

            // Clear receive amount if input is cleared or just a dot
            if (!val || val === ".") {
                setReceiveAmount("");
                setIsInsufficientBalance(false);
                setQuoteError(null);
                return;
            }

            // Check if value exceeds balance
            const numericVal = parseFloat(val) || 0; // Handle '' or '.' resulting in NaN
            const isTooHigh = numericVal > maxBalance;
            setIsInsufficientBalance(isTooHigh);
        }
    };
    const handleReceiveChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const val = e.target.value;
        // const maxBalance = ethBalance?.formatted ? parseFloat(ethBalance.formatted) : 0;

        // STRICT VALIDATION: Only allow numbers and a single decimal point
        // Regex breakdown: ^ start, \d* digits (optional), \.? optional dot, \d* digits (optional), $ end
        if (val === "" || /^\d*\.?\d*$/.test(val)) {
            setReceiveAmount(val);
            setActiveField("RECEIVE"); // Mark Receive as the active field

            if (!val || val === ".") {
                setPayAmount("");
                setIsInsufficientBalance(false);
                setQuoteError(null);
                return;
            }
        }
    };

    // --- EFFECT: PAY -> RECEIVE (GetAmountsOut) ---
    useEffect(() => {
        // Only run if the user is actively typing in the PAY field
        if (activeField !== "PAY") return;
        setQuoteError(null);

        if (!payAmount || payAmount === "." || parseFloat(payAmount) === 0) {
            setReceiveAmount("");
            setIsQuoteLoading(false); // Reset loading
            setQuoteError(null); // Clear errors
            return;
        }

        setIsQuoteLoading(true);
        const timer = setTimeout(async () => {
            try {
                const amountInWei = parseEther(payAmount);
                const tokenPath = isEthToDare
                    ? [wethAddress, tokenAddress]
                    : [tokenAddress, wethAddress];

                console.log(
                    `Getting quote for ${payAmount} ${activePayTokenSymbol}...`,
                );

                const amounts = await readContract(config, {
                    address: uniswapV2RouterAddress,
                    abi: uniswapV2Router02_Abi,
                    functionName: "getAmountsOut",
                    args: [amountInWei, tokenPath],
                });

                let formattedValue;
                if (isEthToDare) {
                    // amounts[1] is the output amount
                    const etherValue = parseFloat(formatEther(amounts[1]));
                    // Truncate to 5 decimal places (10^-5 precision)
                    formattedValue = etherValue.toLocaleString("fullwide", {
                        useGrouping: false,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 5,
                    });
                } else {
                    // amounts[1] is the output amount
                    const dareValue = parseFloat(formatEther(amounts[1]));
                    // Truncate to 10 decimal places (10^-10 precision)
                    formattedValue = dareValue.toLocaleString("fullwide", {
                        useGrouping: false,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 10,
                    });
                }

                setReceiveAmount(formattedValue);
            } catch (error) {
                console.error("Quote fetch error:", error);
                setQuoteError(t("failed_to_fetch_quote"));
            } finally {
                setIsQuoteLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [
        payAmount,
        activeField,
        activePayTokenSymbol,
        isEthToDare,
        t,
        setQuoteError,
        setReceiveAmount,
    ]);

    // --- EFFECT: RECEIVE -> PAY (GetAmountsIn) ---
    useEffect(() => {
        // Only run if the user is actively typing in the RECEIVE field
        if (activeField !== "RECEIVE") return;

        if (
            !receiveAmount ||
            receiveAmount === "." ||
            parseFloat(receiveAmount) === 0
        ) {
            setPayAmount("");
            setIsQuoteLoading(false); // Reset loading
            setQuoteError(null); // Clear errors
            return;
        }

        setIsQuoteLoading(true);
        setQuoteError(null);

        const timer = setTimeout(async () => {
            try {
                try {
                    const amountOutWei = parseEther(receiveAmount);

                    console.log(
                        `Getting reverse quote for ${receiveAmount} ${activePayTokenSymbol}...`,
                    );

                    const tokenPath = isEthToDare
                        ? [wethAddress, tokenAddress]
                        : [tokenAddress, wethAddress];

                    const amounts = await readContract(config, {
                        address: uniswapV2RouterAddress,
                        abi: uniswapV2Router02_Abi,
                        functionName: "getAmountsIn",
                        args: [amountOutWei, tokenPath],
                    });

                    let formattedValue;
                    let maxBalance;
                    let inputNeeded;

                    if (isEthToDare) {
                        inputNeeded = parseFloat(formatEther(amounts[0])); // amounts[0] is input amount needed)
                        formattedValue = inputNeeded.toLocaleString(
                            "fullwide",
                            {
                                useGrouping: false,
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 10,
                            },
                        );

                        // Late Balance Check:
                        maxBalance = ethBalance
                            ? parseFloat(ethBalance.formatted)
                            : 0;
                    } else {
                        inputNeeded = parseFloat(formatEther(amounts[0])); // amounts[0] is input amount needed
                        formattedValue = inputNeeded.toLocaleString(
                            "fullwide",
                            {
                                useGrouping: false,
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 5,
                            },
                        );

                        // Late Balance Check:
                        maxBalance = dareBalance
                            ? parseFloat(dareBalance.formatted)
                            : 0;
                    }

                    setPayAmount(formattedValue);
                    setIsInsufficientBalance(inputNeeded > maxBalance);
                } catch (err) {
                    const msg =
                        (err instanceof Error && err.message.toLowerCase()) ||
                        "";
                    // Catching the specific Uniswap V2 math errors about Insufficient Liquidity
                    if (
                        msg.includes("insufficient_liquidity") ||
                        msg.includes("ds-math-sub-underflow") ||
                        msg.includes("invalid opcode")
                    ) {
                        throw new Error("Insufficient liquidity");
                    }
                    throw err;
                }
            } catch (error) {
                const errorMsg =
                    (error instanceof Error && error.message) || "";
                // Consolidating all liquidity-related errors into one UI message
                if (
                    errorMsg.includes("Insufficient liquidity") ||
                    errorMsg.includes("ds-math-sub-underflow") ||
                    errorMsg.includes("invalid opcode")
                ) {
                    setQuoteError(t("insufficient_pool_liquidity"));
                } else {
                    setQuoteError(t("failed_to_fetch_quote"));
                    console.error("Quote fetch error:", error);
                }
                setPayAmount("");
                // Do not warn about user wallet balance if the pool itself has failed
                setIsInsufficientBalance(false);
            } finally {
                setIsQuoteLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [
        receiveAmount,
        activeField,
        activePayTokenSymbol,
        isEthToDare,
        dareBalance,
        ethBalance,
        t,
        setQuoteError,
        setIsInsufficientBalance,
        setPayAmount,
    ]);

    return {
        handlePayChange,
        handleReceiveChange,
        activeField,
        isQuoteLoading,
    };
}
