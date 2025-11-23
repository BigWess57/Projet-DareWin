'use client'

import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi"

import ChallengeForm, { ChallengeFormValues } from "../Miscellaneous/ChallengeForm"
import { CopyAction } from '../Miscellaneous/CopyAction'
import { factoryAbi } from '@/constants/ChallengeFactoryInfo'

import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { decodeEventLog, parseEther, zeroHash } from 'viem'
import { _toLowerCase } from 'zod/v4/core'

import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { factoryAddress } from "@/config/networks"



const ChallengeFactory = () => {

    const [challengeIpfsCid, setChallengeIpfsCid] = useState<string>("")

    const { data: hash, isPending: isPending, writeContract } = useWriteContract({
        mutation: {
            onError: (err) => {
                //Unpin content on Ipfs if challenge creation has failed
                if (challengeIpfsCid) {
                    fetch('/api/ipfsProofs/unpinProofs', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ipfsHash: challengeIpfsCid })})
                    .then(async (res) => {
                        if (!res.ok) {
                            const errJson = await res.json().catch(() => ({}));
                            toast.error("Error unpinning Proofs on IPFS: " + (errJson.error ?? res.statusText), {
                                duration: 3000,
                            });
                        } else {
                            const response = await res.json();
                            console.log(response?.message ?? "Unpinned (or not pinned)");
                        }
                    })
                    .catch((err) => {
                        toast.error("Network error unpinning Proofs: " + err, {
                            duration: 3000,
                        });
                    });
                }

                if(err.message.toLowerCase().includes("user rejected the request")){
                    toast.error("Error : User rejected the request", {
                        duration: 3000,
                    });
                    return
                }
                toast.error("Creation failed: " + err.message, {
                    duration: 3000,
                })
            },
        },
    })

    //Used to check the current transaction state
    const { data: receipt, isLoading: isConfirming, isSuccess, error: errorConfirmation, } = useWaitForTransactionReceipt({
        hash
    })


    const handleCreateChallenge = async (data: ChallengeFormValues) => {
        
        const duration = data.duration;
        const maxPlayers = data.maxPlayers;
        const bid = parseEther(data.bid);
        const description = data.description;
        const isGroup = data.isGroup;

        // Create merkle root if group mode
        let merkleRoot;
        let ipfsCid;
        if(!isGroup){
            merkleRoot = zeroHash;
            ipfsCid = null;
        }else{
            //Gather authorized players addresses
            const groupAddresses = data.groupAddresses.map((elem: { address: any }) => [elem.address]);
            const tree = StandardMerkleTree.of(groupAddresses, ["address"]);
            merkleRoot = tree.root;

            // Build proofs map: address → proof
            const proofs: Record<string, string[]> = {};

            for (let i = 0; i < groupAddresses.length; i++) {
                const address = groupAddresses[i][0];  // e.g. "0xaaaa...". Already normalized

                // get proof from tree
                const proof = tree.getProof(i);
                // `proof` is an array of `bytes32` hex strings (sibling hashes)

                proofs[address] = proof;
            }

            // Pin the proofs JSON to Pinata via the server endpoint
            const payload = {
                root: merkleRoot,
                proofs: proofs,
                // addresses: groupAddresses,
                createdAt: new Date().toISOString(),
                meta: {
                    challengeCreator: (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0] ?? null,
                },
            };

            const pinRes = await fetch('/api/ipfsProofs/pinProofs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const pinJson = await pinRes.json();
            if (!pinRes.ok || !pinJson.ipfsHash) {
                console.error('Pin failed', pinJson);
                toast.error("Creation failed: Failed to pin Proofs to IPFS. Try again", {
                    duration: 3000,
                })
                return;
            }
            
            ipfsCid = pinJson.ipfsHash; // IPFS CID (e.g. Qm...)
            console.log("Proofs pinned !");
            console.log(ipfsCid);
            setChallengeIpfsCid(ipfsCid);
        }

        writeContract({
            address: factoryAddress,
            abi: factoryAbi,
            functionName: 'createChallenge',
            args: [duration, maxPlayers, bid, description, isGroup, merkleRoot, ipfsCid],
        })
        
    }


    const getContractAddressFromLogs = (receipt: any) => {
        if (!receipt?.logs) return null
        
        // Replace with your actual event ABI
        const contractCreatedEventAbi = {
            "anonymous": false,
            "inputs": [
            {
                "indexed": true,
                "name": "admin",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "challengeAddress",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "timestamp",
                "type": "uint256"
            }
            ],
            "name": "ChallengeCreated",
            "type": "event"
        } as const

        for (const log of receipt.logs) {
            try {
                const decoded = decodeEventLog({
                    abi: [contractCreatedEventAbi],
                    data: log.data,
                    topics: log.topics
                })
                if (decoded.eventName === 'ChallengeCreated') {
                    return decoded.args.challengeAddress
                }
            } catch {
            // Skip logs that don't match
            }
        }
        return null
    }

/****** Use effects ******/

    useEffect(() => {
        if (isConfirming) {
            // Affiche le toast "loading" et garde son ID
            toast.loading('Pending...', {
                id: 1,
                description: 'Creating Challenge...',
                action: null,
            })
        }
        if (isSuccess) {
            const newContractAddress = getContractAddressFromLogs(receipt);

            if(!newContractAddress){
                toast.warning("Warning!", {
                    id: 1,
                    description: "Challenge successfully created, but could not retrieve contract address. Check 'My challenges' tab",
                    duration: 3000,
                })
                return;
            }else{
                toast.success("Transaction Successful!", {
                    id: 1,
                    description: "Challenge créé avec succes a l'adresse " + newContractAddress,
                    action:<CopyAction address={newContractAddress}/>,
                    duration: 5000,
                })
            }

        }
        if(errorConfirmation) {
            //Unpin content on Ipfs if challenge creation has failed
            if (challengeIpfsCid) {
                fetch('/api/ipfsProofs/unpinProofs', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ipfsHash: challengeIpfsCid })})
                .then(async (res) => {
                    if (!res.ok) {
                        const errJson = await res.json().catch(() => ({}));
                        toast.error("Error unpinning Proofs on IPFS: " + (errJson.error ?? res.statusText), {
                            duration: 3000,
                        });
                    } else {
                        console.log("Proofs unpinned successfully");
                    }
                })
                .catch((err) => {
                    toast.error("Network error unpinning Proofs: " + err, {
                        duration: 3000,
                    });
                });
            }

            if(errorConfirmation.message.toLowerCase().includes("user rejected the request")){
                toast.error("Error : User rejected the request", {
                    duration: 3000,
                });
                return
            }
            toast.error(errorConfirmation.message, {
                duration: 3000,
            });
        }
    }, [isSuccess, isConfirming,  errorConfirmation])



    return (
        <div className='flex-center flex-col gap-10 '>
            <div className='text-3xl font-bold'>Crée un nouveau challenge et invite tes amis !</div>

            <ChallengeForm onSubmit={handleCreateChallenge} />
        </div>
        
    )
}

export default ChallengeFactory