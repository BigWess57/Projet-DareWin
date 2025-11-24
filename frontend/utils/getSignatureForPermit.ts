import { Address, parseSignature } from "viem";
import { publicClient } from "./client";
import { signTypedData } from "wagmi/actions";
import { config } from "@/src/app/RainbowKitAndWagmiProvider";


const ERC20_MINIMAL_ABI = [
  // name() -> string
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  // nonces(address) -> uint256  (EIP-2612)
  { name: 'nonces', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] },
];


//Helper function for permit
async function getTimestampPlusOneHourInSeconds() {
    // returns current timestamp in seconds
    // return Math.floor(Date.now() / 1000);
    const latestBlock = BigInt(Math.floor(Date.now() / 1000));
    return latestBlock + 3600n;
}

type SignatureResult = {
  deadline: bigint;
  v: number;        // present if found === true
  r: `0x${string}`;          // root from the JSON (optional)
  s: `0x${string}`;        // present if found === false (error / not present)
};

export const GetRSVsig = async (
    signerAddress: Address, 
    tokenAddress: Address, 
    bid: bigint, 
    challenge: Address
): Promise<SignatureResult> => {
    //For permit
    // set token deadline
    const deadline = await getTimestampPlusOneHourInSeconds();

    // 2) read token name (for domain)
    const name = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_MINIMAL_ABI,
        functionName: 'name',
        // no args
    }).catch((e) => {
        throw new Error(`Failed to read token name: ${String(e)}`);
    });

    // 3) read nonce for signer (EIP-2612 expects token.nonces(owner))
    const nonceRaw = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_MINIMAL_ABI,
        functionName: 'nonces',
        args: [signerAddress],
    }).catch((e) => {
        throw new Error(`Failed to read token nonce: ${String(e)} — token may not implement nonces(address)`);
    });

    // get the current nonce for the deployer address
    const nonce = BigInt((nonceRaw as any) ?? 0n);

    const chainId = await publicClient.getChainId();

    // set the domain parameters
    const domain = {
        name: name as string,
        version: "1",
        chainId: chainId,
        verifyingContract: tokenAddress
    };

    // set the Permit type parameters
    const types = {
        Permit: [{
                name: "owner",
                type: "address"
            },
            {
                name: "spender",
                type: "address"
            },
            {
                name: "value",
                type: "uint256"
            },
            {
                name: "nonce",
                type: "uint256"
            },
            {
                name: "deadline",
                type: "uint256"
            },
        ],
    };


    // set the Permit type values
    const message = {
        owner: signerAddress,
        spender: challenge,
        value: bid,
        nonce: nonce,
        deadline: deadline,
    };

    // sign the Permit type data with the deployer's private key
    const signatureHex = await signTypedData(config, {
        types,
        domain,
        primaryType: 'Permit',
        message,
    })

    const parsed = parseSignature(signatureHex);

    // viem's parseSignature returns { r, s, v } where v is number (27/28) or undefined for some cases
    const vVal = (() => {
        // if (typeof parsed.v === 'number') return BigInt(parsed.v);
        // recoveryParam / yParity fallback: not always present; signature library usually returns v
        if (typeof (parsed as any).yParity === 'number') {
            return 27 + ((parsed as any).yParity as number);
        }
        throw new Error('Unable to parse v from signature');
    })();

    // r and s are hex strings already
    const r = parsed.r;
    const s = parsed.s;

    return  {
        deadline,
        v: vVal,
        r,
        s,
    };
}