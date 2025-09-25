// import type { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';

type PinResponse = {
  ipfsHash?: string;
  error?: string;
};

type ProofPayload = {
  root: string;
  proofs: Record<string, string[]>;
  // addresses?: string[];
  createdAt?: string;
  meta?: Record<string, any>;
};

export async function POST(request: Request) {
  try {
    const jwt = process.env.PINATA_JWT;
    if (!jwt) {
      return NextResponse.json({ error: "PINATA_JWT not configured on server" }, { status: 500 });
    }

  // parse body
    let body: ProofPayload;
    try {
      body = (await request.json()) as ProofPayload;
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // basic validation
    if (!body || typeof body !== "object" || !body.root || !body.proofs) {
      return NextResponse.json({ error: "Payload must include { root, proofs }" }, { status: 400 });
    }

    // Compose body for Pinata API
    const pinataRequestBody = {
      pinataMetadata: {
        name: body?.meta?.name || `challenge-proofs-${Date.now()}`,
      },
      pinataContent: body,
    };

    const pinRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pinataRequestBody),
    });

    const pinData = await pinRes.json();

    // Pinata returns IpfsHash (or sometimes ipfsHash)
    const ipfsHash = pinData?.IpfsHash ?? pinData?.ipfsHash;
    if (!ipfsHash) {
      // log the full response server-side for debugging
      console.error("Pinata pinJSONToIPFS failed:", pinData);
      return NextResponse.json({ error: "Pinata failed to pin content", details: pinData }, { status: 502 });
    }

    // return the cid/ipfs hash
    return NextResponse.json({ ipfsHash, pinataResponse: pinData }, { status: 200 });
  } catch (err: any) {
    console.error("pinProofs handler error:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown server error" }, { status: 500 });
  }
}