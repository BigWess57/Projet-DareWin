import { Dispatch, SetStateAction } from "react";

///Swap Widget types
export type TokenPrice = {
    perEth: number;
    perDare: number;
    formattedFromEthToDare: string;
    formattedFromDareToEth: string;
};

export type SwapForm = {
    pay: {
        amount: string;
        usdValue: string | number;
        token: {
            symbol: string;
            balance:
                | {
                      decimals: number;
                      formatted: string;
                      symbol: string;
                      value: bigint;
                  }
                | undefined;
            loading: boolean;
            color: string;
            isDare: boolean;
        };
        setAmount: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
        active: boolean;
    };
    receive: {
        amount: string;
        usdValue: string | number;
        token: {
            symbol: string;
            balance:
                | {
                      decimals: number;
                      formatted: string;
                      symbol: string;
                      value: bigint;
                  }
                | undefined;
            loading: boolean;
            color: string;
            isDare: boolean;
        };
        setAmount: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
        active: boolean;
    };
    switchDirection: () => void;
    isEthToDare: boolean;
    currentDarePrice: TokenPrice | null;
};

export type SwapSettings = {
    slippage: number;
    setSlippage: Dispatch<SetStateAction<number>>;
};

export type SwapStatus = {
    isConnected: boolean;
    isQuoteLoading: boolean;
    isInsufficientBalance: boolean;
    quoteError: string | null;
    isDarePriceLoading: boolean;
    isDarePriceError: boolean;
};

export type SwapExecution = {
    handleSwap: () => Promise<void>;
    isSwapping: boolean;
    isConfirming: boolean;
    isSuccess: boolean;
    hash: `0x${string}` | undefined;
};
