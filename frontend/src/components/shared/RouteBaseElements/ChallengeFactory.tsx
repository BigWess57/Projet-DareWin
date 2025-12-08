'use client'

import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi"

import ChallengeForm, { ChallengeFormValues } from "../Miscellaneous/ChallengeForm"
import { CopyAction } from '../Miscellaneous/CopyAction'
import { factoryAbi } from '@/constants/ChallengeFactoryInfo'

import { toast } from 'sonner'
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react'
import { decodeEventLog, parseEther, zeroHash } from 'viem'
import { _toLowerCase } from 'zod/v4/core'

import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { factoryAddress } from "@/config/networks"



const ChallengeFactory = () => {
    const t = useTranslations('ChallengeFactory');

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
                            toast.error(t('error_unpin', { error: errJson.error ?? res.statusText }), {
                                duration: 3000,
                            });
                        } else {
                            const response = await res.json();
                            console.log(response?.message ?? "Unpinned (or not pinned)");
                        }
                    })
                    .catch((err) => {
                        toast.error(t('network_error_unpin', { error: String(err) }), {
                            duration: 3000,
                        });
                    });
                }

                if(err.message.toLowerCase().includes("user rejected the request")){
                    toast.error(t('user_rejected'), {
                        duration: 3000,
                    });
                    return
                }
                toast.error(t('creation_failed', { reason: err.message }), {
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
        const bid = parseEther(data.bid);
        const description = data.description;

        // Create merkle root

        let merkleRoot;
        let ipfsCid;
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
            toast.error(t('pin_failed'), {
                duration: 3000,
            })
            return;
        }
        
        ipfsCid = pinJson.ipfsHash; // IPFS CID (e.g. Qm...)
        console.log("Proofs pinned !");
        console.log(ipfsCid);
        setChallengeIpfsCid(ipfsCid);

        console.log("Creating challenge ... ")

        writeContract({
            address: factoryAddress,
            abi: factoryAbi,
            functionName: 'createChallenge',
            args: [duration, bid, description, merkleRoot, ipfsCid],
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
            toast.loading(t('pending'), {
                id: 1,
                description: t('pending_desc'),
                action: null,
            })
        }
        if (isSuccess) {
            const newContractAddress = getContractAddressFromLogs(receipt);

            if(!newContractAddress){
                toast.warning(t('warning'), {
                    id: 1,
                    description: t('warning_desc'),
                    duration: 3000,
                })
                return;
            }else{
                toast.success(t('success'), {
                    id: 1,
                    description: t('success_desc', { address: newContractAddress }),
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
                            toast.error(t('error_unpin', { error: errJson.error ?? res.statusText }), {
                                duration: 3000,
                            });
                        } else {
                            console.log("Proofs unpinned successfully");
                        }
                })
                .catch((err) => {
                        toast.error(t('network_error_unpin', { error: String(err) }), {
                            duration: 3000,
                        });
                });
            }

            if(errorConfirmation.message.toLowerCase().includes("user rejected the request")){
                toast.error(t('user_rejected'), {
                    duration: 3000,
                });
                return
            }
            toast.error(t('error', { message: errorConfirmation.message }), {
                duration: 3000,
            });
        }
    }, [isSuccess, isConfirming,  errorConfirmation])



    return (
        <div className='flex-center flex-col gap-10 '>
            <div className='text-3xl font-bold'>{t('title')}</div>
            <ChallengeForm onSubmit={handleCreateChallenge} />
        </div>
        
    )
}

export default ChallengeFactory