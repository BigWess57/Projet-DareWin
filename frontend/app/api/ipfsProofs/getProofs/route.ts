import { isAddress } from "viem";
import { NextRequest, NextResponse } from 'next/server';
    
type ProofLookupResult = {
  whitelisted: boolean;
  proof?: string[];        // present if found === true
  root?: string;          // root from the JSON (optional)
  reason?: string;        // present if found === false (error / not present)
};
    
export async function POST(req: NextRequest) {
  try {
    
console.log("test")
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
        return NextResponse.json({ error: 'PINATA_JWT not configured on server' }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    const ipfsHash = body?.ipfsHash ?? body?.cid ?? null;
    const userAddress = body?.userAddress ?? body?.address ?? null;
    if (!ipfsHash || !userAddress) {
        return NextResponse.json({ error: 'ipfsHash and user address required' }, { status: 400 });
    }

    // Allow ipfs://CID or raw CID
    const normalizedCid = ipfsHash.startsWith("ipfs://") ? ipfsHash.replace("ipfs://", "") : ipfsHash;

    // 1️⃣ Fetch the Merkle proof JSON directly from IPFS gateway
    const gatewayUrl = `https://ivory-decisive-mite-196.mypinata.cloud/ipfs/${normalizedCid}`;
    const res = await fetch(gatewayUrl);

    if (!res.ok) {
      return NextResponse.json(
        { whitelisted: false, reason: `Failed to fetch ${gatewayUrl}: ${res.status}` },
        { status: 502 }
      );
    }

    const json = await res.json();

    if (!json?.root || !json?.proofs) {
      return NextResponse.json({ whitelisted: false, reason: "Invalid proof file structure" }, { status: 422 });
    }

    // 2️⃣ Normalize and check whitelist
    const proofsObj: Record<string, string[]> = json.proofs;
    const normalizedProofs: Record<string, string[]> = {};

    for (const [k, v] of Object.entries(proofsObj)) {
        try {
            const key = k.toLowerCase();
            if (isAddress(key) && Array.isArray(v) && v.every((x) => typeof x === "string")) {
                normalizedProofs[key] = v;
            }
        } catch {
            // skip invalid address keys
        }
    }

    const proof = normalizedProofs[userAddress];
    if (!proof) return NextResponse.json({ whitelisted: false, reason: "Address not in whitelist" });

    // ✅ Return proof and root if found
    return NextResponse.json({ whitelisted: true, proof, root: json.root });

  } catch (err: any) {
    return NextResponse.json({ whitelisted: false, reason: err.message ?? String(err) }, { status: 500 });
  }
}