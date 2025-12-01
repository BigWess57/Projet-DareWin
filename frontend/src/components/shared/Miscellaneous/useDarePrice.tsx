import { tokenAddress, uniswapV2FactoryAddress, wethAddress } from '@/config/networks';
import { useState, useEffect } from 'react';
import { zeroAddress, isAddress, Address, formatEther } from 'viem';
import { useReadContract } from 'wagmi';


// Minimal ABIs
const FACTORY_ABI = [
  {
    "constant": true,
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenA",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenB",
        "type": "address"
      }
    ],
    "name": "getPair",
    "outputs": [
      {
        "internalType": "address",
        "name": "pair",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
] as const;

const PAIR_ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      {
        "internalType": "uint112",
        "name": "reserve0",
        "type": "uint112"
      },
      {
        "internalType": "uint112",
        "name": "reserve1",
        "type": "uint112"
      },
      {
        "internalType": "uint32",
        "name": "blockTimestampLast",
        "type": "uint32"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
] as const;

type TokenPrice = {
  perEth: number,
  perDare: number,
  formattedFromEthToDare: string,
  formattedFromDareToEth: string,
}

export function useDarePrice() {
  const [pairAddress, setPairAddress] = useState<Address | undefined>();
  const [price, setPrice] = useState<TokenPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // 1. Get pair address from factory
  const { data: pairAddr } = useReadContract({
    address: uniswapV2FactoryAddress,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: [wethAddress, tokenAddress],
  });

  // 2. Get reserves from pair
  const { data: reserves, refetch } = useReadContract({
    address: pairAddress,
    abi: PAIR_ABI,
    functionName: 'getReserves',
  });

  useEffect(() => {
    if (pairAddr && isAddress(pairAddr)) {
      setPairAddress(pairAddr);
    } else if (pairAddr === zeroAddress) {
      console.error('Pair does not exist yet!');
      setPairAddress(undefined);
    }
  }, [pairAddr]);

  useEffect(() => {
    if (!reserves || !pairAddress) return;

    try {
      const reserve0 = reserves[0];
      const reserve1 = reserves[1];

      // Determine token order: token0 is the smaller address
      const [token0, token1] = [wethAddress, tokenAddress].sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
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

      const formattedEthValue = pricePerEth.toLocaleString('fullwide', {
        useGrouping: false,
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      });
      const formattedDareValue = pricePerDare.toLocaleString('fullwide', {
        useGrouping: false,
        minimumFractionDigits: 2,
        maximumFractionDigits: 10
      });
      setPrice({
        perEth: pricePerEth, // 1 ETH = X DARE
        perDare: pricePerDare, // 1 DARE = X ETH
        formattedFromEthToDare: `1 ETH = ${formattedEthValue} DARE`,
        formattedFromDareToEth: `1 DARE = ${formattedDareValue} ETH`,
      });
    } catch (error) {
      setIsError(true);
      console.error('Error calculating price:', error);
    } finally {
      setIsLoading(false);
    }
  }, [reserves, pairAddress, tokenAddress]);


  useEffect(() => {
    refetch()
    // Poll every 10 seconds
    const interval = setInterval(refetch, 10000);
    return () => clearInterval(interval);
  }, []);

  return { price, pairAddress, isLoading, isError, refetch };
}