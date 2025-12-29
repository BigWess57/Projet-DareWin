"use client";
import { useCallback, useState } from "react";

import { tokenAddress } from "@/config/networks";

import { useAccount, useBalance } from "wagmi";
import useGetPrices from "./useGetPrices";
import useSwapTransaction from "./useSwapTransaction";
import useSwapQuote from "./useSwapQuote";

export default function useSwapWidgetLogic() {
    const { address, isConnected } = useAccount();

    // --- BLOCKCHAIN FUNCTIONS ---

    const { data: dareBalance, isLoading: isDareLoading } = useBalance({
        address: address,
        token: tokenAddress,
    });

    const { data: ethBalance, isLoading: isEthLoading } = useBalance({
        address: address,
    });

    // --- COMPONENT STATE ---
    const [payAmount, setPayAmount] = useState("");
    const [receiveAmount, setReceiveAmount] = useState("");
    const [isInsufficientBalance, setIsInsufficientBalance] =
        useState<boolean>(false);

    // Track direction: True = ETH -> DARE, False = DARE -> ETH
    const [isEthToDare, setIsEthToDare] = useState<boolean>(true);

    // State for quote fetching
    const [quoteError, setQuoteError] = useState<string | null>(null);

    const [slippage, setSlippage] = useState<number>(0.5); // Default 0.5%

    // helper fctn for cleanup
    const cleanupDisplay = () => {
        setPayAmount("");
        setReceiveAmount("");
        setIsInsufficientBalance(false);
        setQuoteError(null);
    };

    // --- DERIVED HELPERS FOR DYNAMIC TOKENS ---
    const activePayToken = isEthToDare
        ? {
              symbol: "ETH",
              balance: ethBalance,
              loading: isEthLoading,
              color: "bg-blue-500",
              isDare: false,
          }
        : {
              symbol: "DARE",
              balance: dareBalance,
              loading: isDareLoading,
              color: "bg-gradient-to-r from-pink-500 to-purple-500",
              isDare: true,
          };

    const activeReceiveToken = isEthToDare
        ? {
              symbol: "DARE",
              balance: dareBalance,
              loading: isDareLoading,
              color: "bg-gradient-to-r from-pink-500 to-purple-500",
              isDare: true,
          }
        : {
              symbol: "ETH",
              balance: ethBalance,
              loading: isEthLoading,
              color: "bg-blue-500",
              isDare: false,
          };

    // --- SWITCH DIRECTION ---
    const handleSwitchDirection = () => {
        setIsEthToDare((prev) => !prev);
        // Clear inputs to avoid validation confusion during state transition
        cleanupDisplay();
    };

    // --- CUSTOM HOOKS ---
    // Get current pool price
    const {
        ethPrice: currentEthPrice,
        darePrice: currentDarePrice,
        isLoading: isDarePriceLoading,
        isError: isDarePriceError,
        refetch: refetchDarePrice,
    } = useGetPrices();

    const onSwapSuccess = useCallback(() => {
        refetchDarePrice();
    }, [refetchDarePrice]);

    const { isSwapping, swapConfirming, swapSuccess, hash, handleSwap } =
        useSwapTransaction({
            cleanupDisplay,
            payAmount,
            isInsufficientBalance,
            isEthToDare,
            receiveAmount,
            slippage,
            onSwapSuccess,
        });

    const {
        handlePayChange,
        handleReceiveChange,
        activeField,
        isQuoteLoading,
    } = useSwapQuote({
        isEthToDare,
        ethBalance,
        dareBalance,
        activePayTokenBalance: activePayToken.balance,
        activePayTokenSymbol: activePayToken.symbol,
        payAmount,
        setPayAmount,
        receiveAmount,
        setReceiveAmount,
        setIsInsufficientBalance,
        setQuoteError,
    });

    // --- USE EFFECTS FOR FETCHING QUOTE ---

    // Helper to calculate USD Value
    const getUsdValue = (amountStr: string, isDare: boolean = false) => {
        const val = parseFloat(amountStr);
        if (
            !currentEthPrice ||
            isNaN(val) ||
            val === 0 ||
            currentDarePrice == null
        )
            return " _";
        if (isDare) {
            return val * currentDarePrice?.perDare * currentEthPrice;
        } else {
            return val * currentEthPrice;
        }
    };

    // Dynamic USD Values
    const payUsdValue = getUsdValue(payAmount, activePayToken.isDare);
    const receiveUsdValue = getUsdValue(
        receiveAmount,
        activeReceiveToken.isDare,
    );

    return {
        form: {
            pay: {
                amount: payAmount,
                usdValue: payUsdValue,
                token: activePayToken,
                setAmount: handlePayChange,
                active: activeField === "PAY",
            },
            receive: {
                amount: receiveAmount,
                usdValue: receiveUsdValue,
                token: activeReceiveToken,
                setAmount: handleReceiveChange,
                active: activeField === "RECEIVE",
            },
            switchDirection: handleSwitchDirection,
            isEthToDare,
            currentDarePrice,
        },
        settings: {
            slippage,
            setSlippage,
        },
        status: {
            isConnected,
            isQuoteLoading,
            isInsufficientBalance,
            quoteError,
            isDarePriceLoading,
            isDarePriceError,
        },
        execution: {
            handleSwap,
            isSwapping,
            isConfirming: swapConfirming,
            isSuccess: swapSuccess,
            hash,
        },
    };
}
