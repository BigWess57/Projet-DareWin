'use client';
import { tokenAddress, uniswapV2RouterAddress, wethAddress } from "@/config/networks";
import { tokenAbi, uniswapV2Router02_Abi } from "@/constants/TokenInfo";
import { AlertTriangle, ArrowDown, ArrowDownLeft, ArrowDownUp, ChevronDown, Info, Loader2, Settings, TriangleAlert, Wallet, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Button } from "../../ui/button";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { config } from "@/src/app/RainbowKitAndWagmiProvider";
import { useDarePrice } from "./useDarePrice";
import { toast } from "sonner";
import { CurrentTransactionToast } from "./CurrentTransactionToast";
import { convertSegmentPathToStaticExportFilename } from "next/dist/shared/lib/segment-cache/segment-value-encoding";
import { useTranslations } from "next-intl";


interface TokenIconProps {
  symbol: string;
  color: string;
}

const TokenIcon = ({ symbol, color }: TokenIconProps) => (
  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white mr-2 ${color}`}>
    {symbol[0]}
  </div>
);


const SwapWidget = () => {

  const t = useTranslations('HomePage.Swap');
  const {address, isConnected} = useAccount();

  // --- BLOCKCHAIN FUNCTIONS ---

  const { data: dareBalance, isLoading: isDareLoading } = useBalance({
    address: address,
    token: tokenAddress,
  });

  const { data: ethBalance, isLoading: isEthLoading } = useBalance({
    address: address,
  });

  //Swap
  const { data: hash, isPending, writeContract: swapContract } = useWriteContract({
      mutation: {
          onError: (err) => {
              if(err.message.toLowerCase().includes("user rejected the request")){
                  toast.info(t('swap_failed'), {
                    id: 1,
                    description : t('user_rejected')
                  })
              }else{
                  toast.error(t('swap_failed'), {
                    id: 1,
                    description : err.message
                  })
              }
              setIsSwapping(false);
              cleanupDisplay()
          },
      },
  })
  //Used to check the current transaction state
  const { isLoading: swapConfirming, isSuccess: swapSuccess, error: swapReceiptError, } = useWaitForTransactionReceipt({
      hash: hash
  }) 


  // --- COMPONENT STATE ---
  const [payAmount, setPayAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [isInsufficientBalance, setIsInsufficientBalance] = useState<boolean>(false);

  // Track direction: True = ETH -> DARE, False = DARE -> ETH
  const [isEthToDare, setIsEthToDare] = useState<boolean>(true);

  // Track which input is driving the calculation to prevent loops
  const [activeField, setActiveField] = useState<'PAY' | 'RECEIVE'>('PAY');
  const [ethPrice, setEthPrice] = useState<number | null>(null); // State for Real ETH Price

  // State for quote fetching
  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  
  // Settings State
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [slippage, setSlippage] = useState<number>(0.5); // Default 0.5%


  // Refs for click outside handling
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        // Close if click is NOT in the settings modal AND NOT on the settings button
        if (
            showSettings &&
            settingsRef.current &&
            !settingsRef.current.contains(event.target as Node) &&
            settingsButtonRef.current &&
            !settingsButtonRef.current.contains(event.target as Node)
        ) {
            setShowSettings(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSettings]);

  

  // --- DERIVED HELPERS FOR DYNAMIC TOKENS ---
  const activePayToken = isEthToDare 
    ? { symbol: 'ETH', balance: ethBalance, loading: isEthLoading, color: 'bg-blue-500', isDare: false }
    : { symbol: 'DARE', balance: dareBalance, loading: isDareLoading, color: 'bg-gradient-to-r from-pink-500 to-purple-500', isDare: true };
  
  const activeReceiveToken = isEthToDare 
    ? { symbol: 'DARE', balance: dareBalance, loading: isDareLoading, color: 'bg-gradient-to-r from-pink-500 to-purple-500', isDare: true }
    : { symbol: 'ETH', balance: ethBalance, loading: isEthLoading, color: 'bg-blue-500', isDare: false };

  // Get current pool price
  const { price: currentDarePrice, isLoading: isDarePriceLoading, isError: isDarePriceError, refetch: refetchDarePrice } = useDarePrice();

  // helper fctn for cleanup
  const cleanupDisplay = () => {
    setPayAmount('');
    setReceiveAmount('');
    setIsInsufficientBalance(false);
    setQuoteError(null);
  }



  
  // --- SWITCH DIRECTION ---
  const handleSwitchDirection = () => {
      setIsEthToDare(prev => !prev);
      // Clear inputs to avoid validation confusion during state transition
      cleanupDisplay()
  };

  // Handle Input Change
  const handlePayChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const maxBalance = activePayToken.balance ? parseFloat(activePayToken.balance.formatted) : 0;

    // STRICT VALIDATION: Only allow numbers and a single decimal point
    // Regex breakdown: ^ start, \d* digits (optional), \.? optional dot, \d* digits (optional), $ end
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setPayAmount(val);
      setActiveField('PAY'); // Mark Pay as the active field

      // Clear receive amount if input is cleared or just a dot
      if (!val || val === '.') {
        cleanupDisplay()
        return;
      }

      // Check if value exceeds balance
      const numericVal = parseFloat(val) || 0; // Handle '' or '.' resulting in NaN
      const isTooHigh = numericVal > maxBalance;
      setIsInsufficientBalance(isTooHigh);
    }
  };
  const handleReceiveChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // const maxBalance = ethBalance?.formatted ? parseFloat(ethBalance.formatted) : 0;

    // STRICT VALIDATION: Only allow numbers and a single decimal point
    // Regex breakdown: ^ start, \d* digits (optional), \.? optional dot, \d* digits (optional), $ end
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setReceiveAmount(val);
      setActiveField('RECEIVE'); // Mark Receive as the active field

      if (!val || val === '.') {
        setPayAmount('');
        setIsInsufficientBalance(false);
        setQuoteError(null);
        return;
      }
    }
  };

  // Swap Function
  const handleSwap = async () => {
    if (!payAmount || isInsufficientBalance || !isConnected || !address) return;
    setIsSwapping(true);
    
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes from now

    // Convert input to BigInt Wei
    const amountIn = parseEther(payAmount);

    // Calculate Minimum Output (Based on Slippage Tolerance)
    const slippageMultiplier = BigInt(Math.floor((1 - slippage / 100) * 10000));
    const rawAmountOut = parseEther(receiveAmount);
    const amountOutMin = rawAmountOut * BigInt(slippageMultiplier) / BigInt(10000); 

    if (isEthToDare) {
      // --- ETH -> DARE ---
      console.log("Swapping", payAmount, "ETH for", receiveAmount, " DARE");
      swapContract({
        address: uniswapV2RouterAddress,
        abi: uniswapV2Router02_Abi,
        functionName: 'swapExactETHForTokens',
        account: address as `0x${string}`,
        args: [
            amountOutMin,                     // Min amount of DARE to receive
            [wethAddress, tokenAddress], // Path: WETH -> DARE
            address,                          // Recipient
            deadline                          // Transaction deadline
        ],
        value: amountIn,
      })
    } else {
      console.log("Swapping", payAmount, "DARE for", receiveAmount, " ETH");

      let txHash:`0x${string}` = "0x";
      try{
          //get allowance for UniswapV2Router to spend users DARE Tokens
          const allowance = await readContract(config, {
            address: tokenAddress,
            abi: tokenAbi,
            functionName: 'allowance',
            args: [address, uniswapV2RouterAddress],
          });

          //Check if allowance has already been set
          if(allowance as bigint < amountIn){
              //Approve the use of needed amount of tokens
              txHash = await writeContract(config, {
                  address: tokenAddress,
                  abi: tokenAbi,
                  functionName: 'approve',
                  args: [uniswapV2RouterAddress, amountIn],
                  account: address as `0x${string}`,
              })
              toast.info(t('pending'), {
                  id: 1,
                  description: <div><div>Approving tokens...</div><div>Tx hash : {txHash}</div></div>,
                  action:null,
              })
              
              //Wait for approval of transaction
              await waitForTransactionReceipt(config, { hash: txHash, confirmations: 1  })

              toast.success(t('transaction_success'), {
                  id: 1,
                  description: <div><div>Tokens Approved!</div><div>Tx hash : {txHash}</div></div>,
                  duration: 3000,
              })
          }

          //Initiate swap
          txHash = await writeContract(config, {
              address: uniswapV2RouterAddress,
              abi: uniswapV2Router02_Abi,
              functionName: 'swapExactTokensForETH',
              args: [amountIn, amountOutMin, [tokenAddress, wethAddress], address, deadline],
          })

          toast.info(t('pending'), {
              id: 2,
              description: <div><div>Swapping tokens...</div><div>Tx hash : {txHash}</div></div>,
          })

          
          await waitForTransactionReceipt(config, { hash: txHash, confirmations: 1 })

          toast.success(t('transaction_success'), {
              id: 2,
              description: <div><div>{t('swap_success')}</div><div>Tx hash : {txHash}</div></div>,
              duration: 3000,
          })

      } catch (err:any) {
        if(err.message?.toLowerCase().includes("user rejected the request")) {
          toast.info(t('user_rejected'), {
            duration: 3000,
          });
          return
        }

        console.error('Transaction failed ', err)
        toast.dismiss();
        toast.error("Error", {
            duration: 3000,
            description: <div><div>Could not swap tokens. (see console for more details)</div><div>Tx hash : {txHash}</div></div>,
            // isClosable: true,
        });
      } finally {
        setIsSwapping(false);
        cleanupDisplay()
      }
    }

  };


  // --- USE EFFECTS FOR FETCHING QUOTE ---

  //For swapping
  useEffect(() => {
      if(swapSuccess) {
        refetchDarePrice()
      }
      if(swapReceiptError) {
          console.error('Transaction failed ', swapReceiptError.message)
          toast.error(t('error_while_swapping'), {
              duration: 3000,
          });
      }
      setIsSwapping(false);
      cleanupDisplay()
  }, [swapSuccess, swapReceiptError])


  // --- EFFECT: PAY -> RECEIVE (GetAmountsOut) ---
  useEffect(() => {
    // Only run if the user is actively typing in the PAY field
    if (activeField !== 'PAY') return;

    if (!payAmount || payAmount === '.' || parseFloat(payAmount) === 0) {
      setReceiveAmount('');
      setIsQuoteLoading(false); // Reset loading
      setQuoteError(null); // Clear errors
      return;
    }

    setIsQuoteLoading(true);
    setQuoteError(null);

    const timer = setTimeout(async () => {
      
      try {
        const amountInWei = parseEther(payAmount);

        const tokenPath = isEthToDare ? [wethAddress, tokenAddress] : [tokenAddress, wethAddress];

        console.log(`Getting quote for ${payAmount} ${activePayToken.symbol}...`);

        const amounts = await readContract(config, {
          address: uniswapV2RouterAddress,
          abi: uniswapV2Router02_Abi,
          functionName: 'getAmountsOut',
          args: [amountInWei, tokenPath],
        });

        let formattedValue;
        if (isEthToDare) {
          // amounts[1] is the output amount
          const etherValue = parseFloat(formatEther(amounts[1]));
          // Truncate to 4 decimal places (10^-4 precision)
          formattedValue = etherValue.toLocaleString('fullwide', {
            useGrouping: false,
            minimumFractionDigits: 2,
            maximumFractionDigits: 5
          });
        } else {
          // amounts[1] is the output amount
          const dareValue = parseFloat(formatEther(amounts[1]));
          // Truncate to 8 decimal places (10^-8 precision)
          formattedValue = dareValue.toLocaleString('fullwide', {
            useGrouping: false,
            minimumFractionDigits: 2,
            maximumFractionDigits: 10
          });
        }

        setReceiveAmount(formattedValue); 

      } catch (error) {
        console.error("Quote fetch error:", error);
        setQuoteError(t('failed_to_fetch_quote'));
      } finally {
        setIsQuoteLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
    
  }, [payAmount, activeField]);

  // --- EFFECT: RECEIVE -> PAY (GetAmountsIn) ---
  useEffect(() => {
    // Only run if the user is actively typing in the RECEIVE field
    if (activeField !== 'RECEIVE') return;

    if (!receiveAmount || receiveAmount === '.' || parseFloat(receiveAmount) === 0) {
        setPayAmount('');
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

          console.log(`Getting reverse quote for ${receiveAmount} ${activeReceiveToken.symbol}...`);

          const tokenPath = isEthToDare ? [wethAddress, tokenAddress] : [tokenAddress, wethAddress];

          const amounts = await readContract(config, {
              address: uniswapV2RouterAddress,
              abi: uniswapV2Router02_Abi,
              functionName: 'getAmountsIn',
              args: [amountOutWei, tokenPath],
          });

          let formattedValue;
          let maxBalance;
          let inputNeeded;

          if (isEthToDare) {
            inputNeeded = parseFloat(formatEther(amounts[0])); // amounts[0] is input amount needed)
            formattedValue = inputNeeded.toLocaleString('fullwide', {
              useGrouping: false,
              minimumFractionDigits: 2,
              maximumFractionDigits: 10
            });

            // Late Balance Check:
            maxBalance = ethBalance ? parseFloat(ethBalance.formatted) : 0;
          } else {
            inputNeeded = parseFloat(formatEther(amounts[0])); // amounts[0] is input amount needed
            formattedValue = inputNeeded.toLocaleString('fullwide', {
              useGrouping: false,
              minimumFractionDigits: 2,
              maximumFractionDigits: 5
            });

            // Late Balance Check:
            maxBalance = dareBalance ? parseFloat(dareBalance.formatted) : 0;
          }

          setPayAmount(formattedValue);
          setIsInsufficientBalance(inputNeeded > maxBalance);

        } catch (err: any) {
          const msg = err?.message?.toLowerCase() || '';
          // Catching the specific Uniswap V2 math errors about Insufficient Liquidity
          if (msg.includes('insufficient_liquidity') || 
              msg.includes('ds-math-sub-underflow') || 
              msg.includes('invalid opcode')) {
              throw new Error("Insufficient liquidity");
          }
          throw err;
        }
      } catch (error: any) {
        const errorMsg = error.message || '';
        // Consolidating all liquidity-related errors into one UI message
        if (errorMsg.includes("Insufficient liquidity") || 
          errorMsg.includes("ds-math-sub-underflow") || 
          errorMsg.includes("invalid opcode")) {
          setQuoteError(t('insufficient_pool_liquidity'));
        } else {
          setQuoteError(t('failed_to_fetch_quote'));
          console.error("Quote fetch error:", error);
        }
        setPayAmount('');
        // Do not warn about user wallet balance if the pool itself has failed
        setIsInsufficientBalance(false);
      } finally {
        setIsQuoteLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [receiveAmount, activeField]);


  // --- FETCH REAL ETH PRICE ---
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // Using CoinGecko Free API
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        if (data?.ethereum?.usd) {
          setEthPrice(data.ethereum.usd);
        }
      } catch (error) {
        // Null if API fails
        setEthPrice(null); 
      }
    };

    fetchPrice();
    // Poll every 60 seconds
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper to calculate USD Value
  const getUsdValue = (amountStr: string, isDare: boolean = false) => {
    const val = parseFloat(amountStr);
    if (!ethPrice || isNaN(val) || val === 0 || currentDarePrice == null) return " _";
    if(isDare){
      return  (val * currentDarePrice?.perDare * ethPrice);
    } else {
      return (val * ethPrice);
    }
  };

  // Dynamic USD Values
  const payUsdValue = getUsdValue(payAmount, activePayToken.isDare);
  const receiveUsdValue = getUsdValue(receiveAmount, activeReceiveToken.isDare);

  // Function to calculate price Impact
  const renderPriceImpact = () => {
    if(typeof payUsdValue === 'string' || typeof receiveUsdValue === 'string') return null;
    const payVal = payUsdValue;
    const receiveVal = receiveUsdValue;

    if (!payVal || !receiveVal || payVal === 0) return null;

    // Calculate percentage loss
    const diff = payVal - receiveVal;
    const impactPercent = (diff / payVal) * 100;

    let colorClass = "bg-emerald-500/20 text-emerald-400";
    let label = "";

    if (impactPercent < 0.1) return;

    let danger = false;
    if (impactPercent > 8) {
      danger = true
      colorClass = "bg-red-500/20 text-red-400";
      label = t('high_price_impact');
    } else if (impactPercent > 1) {
      colorClass = "bg-yellow-500/20 text-yellow-400";
      label = "";
    }

    return (
      <div className="relative group/tooltip inline-block ml-2 cursor-help">
        <div className={`flex items-center gap-1 ${danger ? 'text-[12px]' : 'text-[10px]'} px-1.5 py-0.5 rounded ml-2 font-medium whitespace-nowrap ${colorClass}`}>
          {danger ? <TriangleAlert size={danger ? 12 : 10}/> : null}
          {label} - {impactPercent.toFixed(2)}%
        </div>
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1F243A] text-gray-200 text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-normal w-48 text-center border border-white/10 shadow-xl z-50">
            {t('price_impact_tooltip')}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1F243A] rotate-45 border-r border-b border-white/10"></div>
        </div>
      </div>
    );
  };

  //On address change, clean up display
  useEffect(() => {
    setPayAmount('');
    setReceiveAmount('');
    setIsInsufficientBalance(false);
    setQuoteError(null);
  }, [address]);

  // --- RENDERING ---
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Glow Effect */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl opacity-40 blur-lg group-hover:opacity-60 transition duration-500"></div>
        
        <div className="relative bg-[#151929] border border-white/10 rounded-3xl p-4 shadow-2xl">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-white font-semibold text-lg">{t('title')}</h3>
            <div className="flex gap-2">
                <button className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"><Info size={20} /></button>
                <button 
                  ref={settingsButtonRef}
                  onClick={() => setShowSettings(!showSettings)}
                  className={`text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full ${showSettings ? 'bg-white/10 text-white' : ''}`}
                >
                  <Settings size={20} />
                </button>
            </div>

            {/* SETTINGS MODAL */}
            {showSettings && (
                <div ref={settingsRef} className="absolute top-12 right-2 z-50 bg-[#1F243A] border border-white/10 rounded-xl p-4 shadow-xl w-64 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-semibold text-white">{t('transaction_settings')}</span>
                        <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white hover:bg-white/5 rounded-full p-1"><X size={16}/></button>
                    </div>
                    <div className="text-xs text-gray-400 mb-2 font-medium">{t('slippage_tolerance')}</div>
                    <div className="flex gap-2 mb-3">
                        {[0.5, 1.0, 2.0, 5.0].map((val) => (
                            <button
                                key={val}
                                onClick={() => setSlippage(val)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${slippage === val ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'}`}
                            >
                                {val}%
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <div className={`flex items-center bg-[#0F111A] border rounded-lg px-3 py-2 ${slippage > 5 || slippage < 0.01 ? 'border-yellow-500/50' : 'border-white/10'}`}>
                            <input
                                type="number"
                                value={slippage}
                                onChange={(e) => setSlippage(parseFloat(e.target.value))}
                                className={`bg-transparent text-right text-sm outline-none w-full font-medium ${slippage > 5 || slippage < 0.01 ? 'text-yellow-400' : 'text-white'}`}
                                placeholder="Custom"
                                min="0"
                                max="50"
                                step="0.1"
                            />
                            <span className="text-gray-400 text-xs ml-1 font-medium">%</span>
                        </div>
                    </div>
                    {slippage > 5 && (
                        <div className="flex items-start gap-1.5 mt-2 text-yellow-400/90 text-[10px] leading-tight bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                            <span>{t('frontrun_warning')}</span>
                        </div>
                    )}
                     {slippage < 0.05 && (
                        <div className="flex items-start gap-1.5 mt-2 text-yellow-400/90 text-[10px] leading-tight bg-yellow-400/10 p-2 rounded-lg border border-yellow-400/20">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                            <span>{t('fail_warning')}</span>
                        </div>
                    )}
                </div>
            )}
          </div>

          {/* Pay Input Section */}
          <div 
            className={`bg-[#0F111A] rounded-2xl p-4 mb-2 border transition-colors group 
              ${isInsufficientBalance 
                ? 'border-red-500/50' 
                : 'border-white/5 hover:border-white/10 focus-within:border-cyan-500/30'
              }`}
          >
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{t('you_pay')}</span>
              <span className={`flex items-center gap-1 ${isInsufficientBalance ? 'text-red-400' : ''}`}>
                {t('balance')}: {activePayToken.loading ? (
                  <span className="animate-pulse bg-white/10 w-10 h-3 rounded"></span>
                ) : (
                  <span className={isInsufficientBalance ? 'text-red-400 font-medium' : 'text-white/90'}>{activePayToken.balance?.formatted ? Number(activePayToken.balance.formatted).toFixed(isEthToDare ? 6 : 2) : '0.00'}</span>
                )}{activePayToken.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
              {isQuoteLoading && activeField === 'RECEIVE' ? (
                 <div className="w-2/3 h-9 flex items-center">
                    <Loader2 className="animate-spin text-blue-500" size={24} />
                    <span className="ml-3 text-white/30 text-sm">{t('calculating')}</span>
                 </div>
              ) : (
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={payAmount}
                  onChange={handlePayChange}
                  className={`bg-transparent text-3xl font-medium outline-none w-2/3 placeholder-gray-600
                    ${isInsufficientBalance ? 'text-red-400' : 'text-white'}
                    ${isQuoteLoading && activeField === 'RECEIVE' && 'opacity-50'}
                  `}
                  placeholder="0.0"  
                />
              )}
              <button className={`flex items-center bg-[#1F243A] text-white px-3 py-1.5 rounded-full font-medium transition-all border border-white/10 ring-2 ${isEthToDare ? 'ring-blue-500/20' : 'ring-purple-500/20'}`}>
                <TokenIcon symbol={activePayToken.symbol} color={activePayToken.color} />
                {activePayToken.symbol}
              </button>
            </div>
            <div className="text-gray-500 text-sm mt-1 flex flex-col">
              {isQuoteLoading ? null
              : <span className="text-gray-500">
                  {/* DISPLAY REAL USD VALUE FOR ETH */}
                  ≈ ${payUsdValue.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </span>
              }
              {isInsufficientBalance && <span className="text-red-400 font-medium">{t('insufficient_balance')}</span>}
            </div>
          </div>

          {/* Switch Button (Centered) */}
          <div className="relative h-4 flex justify-center items-center z-10">
            <button 
              onClick={handleSwitchDirection}
              className="absolute bg-[#1F243A] border-4 border-[#151929] rounded-xl p-2 text-cyan-400 transition-all shadow-lg  hover:text-white hover:bg-cyan-600 hover:scale-110 active:scale-95"
            >
              <ArrowDownUp size={30} className={`duration-300 ${!isEthToDare ? 'rotate-180' : ''}`}/>
            </button>
          </div>

          {/* Receive Input Section */}
          <div className="bg-[#0F111A] rounded-2xl p-4 mt-2 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{t('you_receive')}</span>
              <span>
                {t('balance')}: {activeReceiveToken.loading ? (
                   <span className="animate-pulse bg-white/10 w-10 h-3 rounded"></span>
                ) : (
                    <span className="text-white/90">
                      {activeReceiveToken.balance?.formatted ? Number(activeReceiveToken.balance.formatted).toFixed(isEthToDare ? 2 : 6): '0.00'}
                    </span>
                )} {activeReceiveToken.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
              {isQuoteLoading && activeField === 'PAY' ? (
                 <div className="w-2/3 h-9 flex items-center">
                    <Loader2 className="animate-spin text-purple-600" size={24} />
                    <span className="ml-3 text-white/30 text-sm">{t('fetching_rate')}</span>
                 </div>
              ) : (
                <input 
                  type="text" 
                  inputMode="decimal"
                  value={receiveAmount}
                  onChange={handleReceiveChange}
                  className="bg-transparent text-3xl text-white font-medium outline-none w-2/3 placeholder-gray-600"
                  placeholder="0.0"
                />
              )}
              <button className={`flex items-center bg-[#1F243A] text-white px-3 py-1.5 rounded-full font-medium transition-all border border-white/10 ring-2 ${isEthToDare ? 'ring-purple-500/20' : 'ring-blue-500/20'}`}>
                <TokenIcon symbol={activeReceiveToken.symbol} color={activeReceiveToken.color} />
                {activeReceiveToken.symbol}
              </button>
            </div>
              {quoteError ? 
                <span className="text-red-400">{quoteError}</span> 
              : isQuoteLoading ? null
              : <div className="flex items-center">
                  ≈ ${receiveUsdValue.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                  {renderPriceImpact()}
                </div>
              }
          </div>

          {/* Price Info */}
          <div className="flex justify-between items-center px-4 py-3 text-sm">
            <div className={`flex items-center font-medium cursor-pointer  ${isDarePriceError ? 'text-red-500  hover:text-red-400' : 'text-cyan-400  hover:text-cyan-300'}`}>
              <Info size={14} className="mr-1" />
              {isDarePriceError ? t('error_retrieving_price')
                : isDarePriceLoading ? <><Loader2 size={20} className="animate-spin" /> <span className="ml-2">{t('fetching_dare_price')}</span></>
                : isEthToDare ? currentDarePrice?.formattedFromEthToDare
                : currentDarePrice?.formattedFromDareToEth}
            </div>
            {/* <div className="flex items-center text-gray-400">
              <span className="mr-2">Gas</span>
              <span className="text-white font-medium">$4.50</span>
            </div> */}
          </div>

          {/* Action Button */}
          {!isConnected ? (
            <button
              className="w-full bg-cyan-600/20  text-cyan-400 font-bold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Wallet size={20} />
              {t('connect_wallet')}
            </button>
          ) : (
            <Button 
              onClick={handleSwap}
              disabled={!payAmount || isSwapping || isInsufficientBalance || isQuoteLoading || !!quoteError}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold py-8 text-xl rounded-2xl shadow-lg shadow-purple-500/25 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSwapping ? <><Loader2 size={20} className="animate-spin" /><span className="ml-2">{t('swapping')}</span></> 
                : isInsufficientBalance ? t('insufficient_balance')
                : !!quoteError ? t('invalid_amount')
                : isQuoteLoading ? t('fetching_price') 
                : !payAmount ? t('enter_amount')
                : t('swap_tokens')}
            </Button>
          )}

          <CurrentTransactionToast isConfirming={swapConfirming} isSuccess={swapSuccess} successMessage={t('swap_success')} txHash={hash}/>
        </div>
      </div>
    </div>
  );
};

export default SwapWidget;