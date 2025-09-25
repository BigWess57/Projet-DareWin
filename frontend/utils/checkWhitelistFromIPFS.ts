import { isAddress } from "viem";

    
type ProofLookupResult = {
  whitelisted: boolean;
  proof?: string[];        // present if found === true
  root?: string;          // root from the JSON (optional)
  reason?: string;        // present if found === false (error / not present)
};
    
export const checkWhitelistFromIpfs = async (
    cid: string,
    connectedAddress: string,
    gateway = 'https://gateway.pinata.cloud/ipfs'
): Promise<ProofLookupResult> => {
    try {
        const userAddress = connectedAddress.toLowerCase();

        if (!cid) return { whitelisted: false, reason: 'No CID provided' };

        // Normalize CID form (allow ipfs://CID too)
        const normalizedCid = cid.startsWith('ipfs://') ? cid.replace('ipfs://', '') : cid;

        const url = `${gateway}/${normalizedCid}`;
        const res = await fetch(url);
        if (!res.ok) return { whitelisted: false, reason: `Failed to fetch ${url}: ${res.status}` };

        const json = await res.json();
        if (!json || !json.root || !json.proofs) return { whitelisted: false, reason: 'Invalid proof file' };

        const proofsObj: Record<string, string[]> = json.proofs as Record<string, string[]>;
        if (!proofsObj || typeof proofsObj !== "object") {
            return { whitelisted: false, reason: "Proofs object missing in JSON" };
        }
        // keys in the JSON might be mixed case — normalize to checksum form
        const normalizedProofs: Record<string, string[]> = {};
        for (const [k, v] of Object.entries(proofsObj)) {
            try {
                const keyChecksum = k.toLowerCase();
                // ensure proof is an array of strings
                if (isAddress(keyChecksum) && Array.isArray(v) && v.every((x) => typeof x === "string")) {
                    normalizedProofs[keyChecksum] = v as string[];
                }
            } catch {
                // skip invalid address keys
            }
        }
        // console.log(normalizedProofs)

        const proof = normalizedProofs[userAddress];
        if (!proof) return { whitelisted: false, reason: "Address not present in whitelist proofs" };

        return { whitelisted: true, proof, root: json.root };

    } catch (err: any) {
        return { whitelisted: false, reason: err?.message ?? String(err) };
    }
}