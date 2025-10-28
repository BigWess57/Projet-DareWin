import { useContext, useEffect, useState } from "react";

import { toast } from "sonner"

import { Address, isAddressEqual, parseAbiItem } from "viem"
import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWatchContractEvent, useWriteContract } from "wagmi"

import { contractAbi } from "@/constants/ChallengeInfo"

import { wagmiEventRefreshConfig } from '@/utils/client';

import { BidContext } from "../RouteBaseElements/ChallengePage";
 import { ReadContractErrorType } from "wagmi/actions";

import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { ContractAddressContext } from "../RouteBaseElements/ChallengePage";
import Joined from "../Miscellaneous/Joined";
import { CurrentTransactionToast } from "../Miscellaneous/CurrentTransactionToast";

import { GetRSVsig } from "@/utils/getSignatureForPermit";
import { getPlayers } from "@/utils/apiFunctions";

import { Loader2 } from "lucide-react";
import { tokenAddress } from "@/config/networks";


// small type guard — narrows unknown -> readonly `0x${string}`[]
function isHexArray(x: unknown): x is `0x${string}`[] {
  if (!Array.isArray(x)) return false;
  return x.every(item => typeof item === 'string' && /^0x[0-9a-fA-F]+$/.test(item));
}


const JoiningChallenge = ({refetchStatus} : {refetchStatus: (options?: RefetchOptions) => Promise<QueryObserverResult<unknown, ReadContractErrorType>>}) => {

    const bid = useContext(BidContext)
    const contractAddress = useContext(ContractAddressContext)

    const {address} = useAccount()

    const [userHasJoined, setUserHasJoined] = useState<boolean>(false)

    const [challengeCid, setChallengeCid] = useState<string>("")
    const [challengeMerkleProof, setChallengeMerkleProof] = useState<readonly `0x${string}`[]>()

    const [isRefetchingStatus, setIsRefetchingStatus] = useState<boolean>(false);

    /***************** 
 * Functions for interaction with the blockchain 
 * **************/


    //For join transaction
    const { data: joinHash, isPending: isJoining, writeContract: joinContract, } = useWriteContract({
        mutation: {
            onError: (err) => {
                if(err.message.toLowerCase().includes("user rejected")){
                    toast.error("joining failed: Use rejected the request")
                }else{
                    toast.error("joining failed: " + err.message)
                }
            },
        },
    })
    //Used to check the current transaction state
    const { isLoading: joinConfirming, isSuccess: joinSuccess, error: joinReceiptError, } = useWaitForTransactionReceipt({
        hash: joinHash
    }) 


    //For withdraw transaction
    const { data: withdrawHash, isPending: isWithdrawing, writeContract: withdrawContract, } = useWriteContract({
        mutation: {
            onError: (err) => {
                if(err.message.toLowerCase().includes("user rejected")){
                    toast.error("withdrawal failed: Use rejected the request")
                }else{
                    toast.error("withdrawal failed: " + err.message)
                }
            },
        },
    })
    //Used to check the current transaction state
    const { isLoading: withdrawConfirming, isSuccess: withdrawSuccess, error: withdrawReceiptError, } = useWaitForTransactionReceipt({
        hash: withdrawHash
    }) 


    //For start challenge transaction
    const { data: startHash, isPending: isStarting, writeContract: startContract, } = useWriteContract({
        mutation: {
            onError: (err) => {
                if(err.message.toLowerCase().includes("user rejected")){
                    toast.error("start failed: Use rejected the request")
                }else{
                    toast.error("start failed: " + err.message)
                }
            },
        },
    })
    //Used to check the current transaction state
    const { isLoading: startConfirming, isSuccess: startSuccess, error: startReceiptError, } = useWaitForTransactionReceipt({
        hash: startHash
    })


    const { data: readData, error: error, isPending: IsPending, refetch: refetch } = useReadContracts({
        contracts: [
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'owner',
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'groupMode',
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'ipfsCid',
            },
            {
                address: contractAddress,
                abi: contractAbi,
                functionName: 'Players',
                args: [address as Address],
            },
        ],
        account: address as `0x${string}` | undefined
      })


    // const [allowance, setAllowance] = useState<bigint>(0n)
    const [challengeOwner, setChallengeOwner] = useState<Address>("0x0000000000000000000000000000000000000000")
    const [groupMode, setGroupMode] = useState<boolean>(false)

    const [isAllowed, setIsAllowed] = useState<boolean>(false)
    const [isCheckingWhitelist, setIsCheckingWhitelist] = useState(false);

    const [players, setPlayers] = useState<(Address)[]>([]);

    
      //Get players from GraphQL (through next server endpoint)
    const getPlayersForChallenge = async() => {
        const CurrentPlayers = await getPlayers(`/api/challenges/getAllPlayers?address=${contractAddress}`);
        setPlayers(CurrentPlayers);
    }


    const joinChallenge = async () => {
        
        if(!address) return;

        const {deadline, v, r, s} = await GetRSVsig(address, tokenAddress, bid, contractAddress)

        let merkleProof;
        if (groupMode) {
            if(!challengeMerkleProof){
                // user not whitelisted or proof not loaded yet
                toast.error('No Merkle proof available for your address.');
                return;
            }else{
                merkleProof = challengeMerkleProof;
            }
        }else{
            merkleProof = [];
        }

        joinContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'joinChallenge',
            account: address as `0x${string}`,
            args: [deadline, v, r, s, merkleProof],
        })
    }

    const withdrawFromChallenge = () => {
        withdrawContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'withdrawFromChallenge',
            account: address as `0x${string}`,
        })
    }


    const startChallenge = () => {
        startContract({
            address: contractAddress,
            abi: contractAbi,
            functionName: 'startChallenge',
            account: address as `0x${string}`,
        })
    }
    
    

    useWatchContractEvent({
        address: contractAddress,
        abi: [
            parseAbiItem(
                'event ChallengeStarted(uint256 startingTime)',
            ),
        ],
        eventName: 'ChallengeStarted',
        config: wagmiEventRefreshConfig,
        poll: true,
        pollingInterval: 5_000,
        onLogs: (logs) => {
            // This will trigger immediately when the event is emitted
            refetchStatus();
        },
    })



 /********** Use effects *************/

    //For joining
    useEffect(() => {
        if(joinSuccess) {
            setUserHasJoined(true)

            if(!address) return;
            //Update players list (add current user)
            setPlayers(prev => [address, ...prev]);

            // Refetch after delay as backup
            const timer = setTimeout(() => {
                refetch()
            }, 2000)
            
            return () => clearTimeout(timer)
        }
        if(joinReceiptError) {
            console.error('Transaction failed ', joinReceiptError.message)
            toast.error("Error : Could not join the challenge", {
                duration: 3000,
            });
        }
    }, [joinSuccess, joinReceiptError])

    //For withdraw
    useEffect(() => {
        if(withdrawSuccess) {
            setUserHasJoined(false)

            if(!address) return;
            //Update players list (remove current user)
            setPlayers((prevPlayers) =>
                prevPlayers.filter(
                    (p) => p.toLowerCase() !== address.toLowerCase()
                )
            );

            // Refetch after delay as backup
            const timer = setTimeout(() => {
                refetch()
            }, 2000)
            
            return () => clearTimeout(timer)
        }
        if(withdrawReceiptError) {
            console.error('Transaction failed ', withdrawReceiptError.message)
            toast.error("Error : Could not leave the challenge", {
                duration: 3000,
            });
        }
    }, [withdrawSuccess, withdrawReceiptError])
    
    //For start challenge
    useEffect(() => {
        if(startSuccess) {
            //set display at loading
            setIsRefetchingStatus(true)

            // Refetch after delay as backup
            const timer = setTimeout(async () => {
                try {
                    await refetchStatus();
                } catch (error) {
                    console.error('Failed to refetch status:', error);
                } finally {
                    setIsRefetchingStatus(false);
                }
            }, 2000)
            return () => {
                clearTimeout(timer);
                setIsRefetchingStatus(false);
            }
        }
        if(startReceiptError) {
            console.error('Transaction failed ', startReceiptError.message)
            toast.error("Error : Could not start the challenge", {
                duration: 3000,
            });
        }
    }, [startSuccess, startReceiptError])


    // Getting data from the contract
    useEffect(() => {
        if (!readData) return

        // owner
        const owner = readData[0].result
        setChallengeOwner(owner as Address)

        // group mode
        const mode = readData[1].result
        setGroupMode(mode as boolean)

        const ipfsCid = readData[2].result
        setChallengeCid(ipfsCid as string)

        const player = readData[3].result
        if (player == undefined){
            toast.error("Error : Could not retrieve player info from contract", {
                duration: 3000,
            });
            return;
        }
        const hasJoined = player[0];
        setUserHasJoined(hasJoined)

        refetchStatus();
    }, [readData, address])

    
    useEffect(() => {
        if(!address || !groupMode || !challengeCid) return;
        
        const connected = address.toLowerCase();

        const params = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cid: challengeCid,
                address: connected,
            }),
        }

        setIsCheckingWhitelist(true); // start loading

        //Get proofs from IPFS, to know if the player is allowed to join
        fetch(`/api/ipfsProofs/getProofs`, params)
            .then(async (res) => {
                const result = await res.json();

                if (result.whitelisted && result.proof !== undefined) {

                    setIsAllowed(true);

                    if (!result.proof) {
                        // user not whitelisted or proof not loaded yet
                        toast.error('No Merkle proof available for your address.');
                        return;
                    }

                    if (!isHexArray(result.proof)) {
                        toast.error('Invalid proof format.');
                        return;
                    }

                    setChallengeMerkleProof(result.proof)
                } else {
                    console.warn('Not whitelisted:', result.reason);
                    setIsAllowed(false);
                }
            })
            .catch((err) => {
                console.error("Error fetching whitelist:", err);
                setIsAllowed(false);
            })
            .finally(() => {
                setIsCheckingWhitelist(false); // stop loading
            });

    }, [challengeCid, address])


    useEffect(() => {
        getPlayersForChallenge();
    }, [address])



    //For displaying moving dots
    const [dots, setDots] = useState(".");

    useEffect(() => {
        const interval = setInterval(() => {
        setDots((prev) => {
            if (prev === "...") return ".";
            return prev + ".";
        });
        }, 500);

        return () => clearInterval(interval);
    }, []);


/************
 * Display
 *************/

    const LoadingSpinner = () => (
        <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Updating challenge status...</p>
        </div>
    );

    return (
        <>
            {isRefetchingStatus ? (
                <LoadingSpinner/>
            ) : (
                <div className="space-y-6 p-6 bg-gradient-to-br from-[#1F243A] to-[#151A2A] border border-white/10 rounded-2xl shadow-xl">
                    {/* Statut d’attente */}
                    <div className="flex items-center justify-between bg-[#0B1126] p-4 rounded-lg border border-cyan-500/20">
                        <p className="flex items-center gap-2 text-xl font-semibold text-white/90">
                        🚀 En attente de joueurs{dots}
                        </p>
                        <div className="flex flex-col items-end space-y-1 text-sm">
                        <div className="text-white/60">
                            Mode : <span className="font-semibold text-cyan-400">{groupMode ? 'Friend Group' : 'Public'}</span>
                        </div>
                        {groupMode && (
                            <div className={`text-sm ${isAllowed ? 'text-green-400' : 'text-red-400'}`}>
                                {isCheckingWhitelist ? (
                                    <div className="flex items-center text-cyan-500 justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Chargement des adresses autorisées...</span>
                                    </div>
                                ) : isAllowed === true ? (
                                    'Vous etes autorisé a participer au challenge'
                                ) : isAllowed === false ? (
                                    "Vous n'etes pas autorisé a participer au challenge"
                                ) : null}
                            </div>
                        )}
                        </div>
                    </div>

                    {/* Header d’état + Actions */}
                    <div className="flex items-center justify-between space-x-4">
                        {/* Boutons JOIN / LEAVE */}
                        {!userHasJoined ? (
                            <button
                            onClick={joinChallenge}
                            disabled={groupMode && !isAllowed}
                            className={`
                                w-1/3 px-4 py-3 rounded-lg font-medium transition
                                ${groupMode && !isAllowed
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:brightness-110'}
                            `}
                            >
                            REJOINDRE
                            </button>
                        ) : (
                            <button
                            onClick={withdrawFromChallenge}
                            disabled={groupMode && !isAllowed}
                            className={`
                                w-1/3 px-4 py-3 rounded-lg font-medium transition
                                ${groupMode && !isAllowed
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:brightness-110'}
                            `}
                            >
                            QUITTER
                            </button>
                        )}

                        {/* Bouton Start Challenge (propriétaire uniquement) */}
                        {challengeOwner && address && isAddressEqual(challengeOwner, address) && (
                            <button
                            onClick={startChallenge}
                            disabled={players.length < 2}
                            className={`
                                px-4 py-2 rounded-lg font-semibold transition
                                ${players.length < 2
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:brightness-110'}
                            `}
                            >
                                Démarrer le défi
                            </button>
                        )}
                    </div>

                    {/* Liste des joueurs */}
                    <div className="p-4 bg-[#0B1126] rounded-lg border border-white/10">
                        <h4 className="text-sm text-white/60 uppercase mb-2">Joueurs :</h4>
                        <div className="flex flex-col gap-2 text-white">
                        {players?.length > 0 ? (
                            [...players].reverse().map((addr) => (
                                <Joined address={addr} key={addr} />
                            ))
                        ) : (
                            <div className="italic text-white/50">(aucun pour l'instant)</div>
                        )}
                        </div>
                    </div>

                    <CurrentTransactionToast isConfirming={joinConfirming} isSuccess={joinSuccess} successMessage="Vous avez rejoint le challenge avec succès!" />
                    <CurrentTransactionToast isConfirming={startConfirming} isSuccess={startSuccess} successMessage="Le challenge a démarré avec succès!" />
                    <CurrentTransactionToast isConfirming={withdrawConfirming} isSuccess={withdrawSuccess} successMessage="Vous avez quitté le challenge" />
                </div>
            )}
        </>
    )
}

export default JoiningChallenge