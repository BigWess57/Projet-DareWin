import { useState, useEffect } from "react";

import {
    tokenAddress,
    uniswapV2FactoryAddress,
    wethAddress,
} from "@/config/networks";
import { FACTORY_ABI, PAIR_ABI } from "@/constants/TokenInfo";

import { TokenPrice } from "@/utils/types";

import { zeroAddress, isAddress, Address, formatEther } from "viem";
import { useReadContract } from "wagmi";

export default function useGetPrices() {
    const [pairAddress, setPairAddress] = useState<Address | undefined>();
    const [darePrice, setDarePrice] = useState<TokenPrice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [ethPrice, setEthPrice] = useState<number | null>(null); // State for Real ETH Price

    // 1. Get pair address from factory
    const { data: pairAddr } = useReadContract({
        address: uniswapV2FactoryAddress,
        abi: FACTORY_ABI,
        functionName: "getPair",
        args: [wethAddress, tokenAddress],
    });

    // 2. Get reserves from pair
    const { data: reserves, refetch } = useReadContract({
        address: pairAddress,
        abi: PAIR_ABI,
        functionName: "getReserves",
    });

    useEffect(() => {
        if (pairAddr && isAddress(pairAddr)) {
            setPairAddress(pairAddr);
        } else if (pairAddr === zeroAddress) {
            console.error("Pair does not exist yet!");
            setPairAddress(undefined);
        }
    }, [pairAddr]);

    useEffect(() => {
        if (!reserves || !pairAddress) return;

        try {
            const reserve0 = reserves[0];
            const reserve1 = reserves[1];

            // Determine token order: token0 is the smaller address
            const [token0] = [wethAddress, tokenAddress].sort((a, b) =>
                a.toLowerCase().localeCompare(b.toLowerCase()),
            );

            // Calculate price based on token order
            let ethAmount, dareAmount;
            if (token0 === wethAddress) {
                // WETH is token0
                ethAmount = formatEther(reserve0);
                dareAmount = formatEther(reserve1);
            } else {
                // DARE is token0
                ethAmount = formatEther(reserve1);
                dareAmount = formatEther(reserve0);
            }

            // Price: 1 ETH = ? DARE
            const pricePerEth = parseFloat(dareAmount) / parseFloat(ethAmount);
            // Price: 1 DARE = ? ETH
            const pricePerDare = parseFloat(ethAmount) / parseFloat(dareAmount);

            const formattedEthValue = pricePerEth.toLocaleString("fullwide", {
                useGrouping: false,
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
            });
            const formattedDareValue = pricePerDare.toLocaleString("fullwide", {
                useGrouping: false,
                minimumFractionDigits: 2,
                maximumFractionDigits: 10,
            });
            setDarePrice({
                perEth: pricePerEth, // 1 ETH = X DARE
                perDare: pricePerDare, // 1 DARE = X ETH
                formattedFromEthToDare: `1 ETH = ${formattedEthValue} DARE`,
                formattedFromDareToEth: `1 DARE = ${formattedDareValue} ETH`,
            });
        } catch (error) {
            setIsError(true);
            console.error("Error calculating price:", error);
        } finally {
            setIsLoading(false);
        }
    }, [reserves, pairAddress]);

    // --- FETCH REAL ETH PRICE ---
    useEffect(() => {
        const fetchPrice = async () => {
            try {
                // Using CoinGecko Free API
                const response = await fetch(
                    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
                );
                const data = await response.json();
                if (data?.ethereum?.usd) {
                    setEthPrice(data.ethereum.usd);
                }
            } catch (error) {
                console.log(error);
                // Null if API fails
                setEthPrice(null);
            }
        };

        fetchPrice();
        // Poll every 60 seconds
        const interval = setInterval(fetchPrice, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        refetch();
        // Poll every 5 seconds
        const interval = setInterval(refetch, 5000);
        return () => clearInterval(interval);
    }, [refetch]);

    return { ethPrice, darePrice, pairAddress, isLoading, isError, refetch };
}
