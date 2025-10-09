// import type { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';


export async function POST(request: Request) {
    try {
        const jwt = process.env.PINATA_JWT;
        if (!jwt) {
            return NextResponse.json({ error: 'PINATA_JWT not configured on server' }, { status: 500 });
        }

        const body = await request.json().catch(() => null);
        const ipfsHash = body?.ipfsHash ?? body?.cid ?? null;
        if (!ipfsHash) {
            return NextResponse.json({ error: 'ipfsHash required' }, { status: 400 });
        }

        // 1) Check pinList to see if this cid is pinned on Pinata
        const pinListUrl = `https://api.pinata.cloud/data/pinList?status=pinned&cid=${encodeURIComponent(ipfsHash)}`;
        const listRes = await fetch(pinListUrl, {
            method: 'GET',
            headers: { Authorization: `Bearer ${jwt}` },
        });
        const listJson = await listRes.json().catch(() => null);

        // listJson.rows (if present) will contain entries for pinned items
        const isPinned = !!(listJson?.rows && Array.isArray(listJson.rows) && listJson.rows.length > 0);

        if (!isPinned) {
            return NextResponse.json({ ok: true, message: 'CID not pinned (no action)' }, { status: 200 });
        }


        // 2) Call Pinata unpin endpoint (DELETE)
        const unpinRes = await fetch(`https://api.pinata.cloud/pinning/unpin/${encodeURIComponent(ipfsHash)}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
        });

        const data = await unpinRes.json().catch(() => ({}));
        if (!unpinRes.ok) {
            console.error('Pinata unpin failed', data);
            return NextResponse.json({ error: 'Pinata unpin failed', details: data }, { status: 502 });
        }

        // success
        return NextResponse.json({ ok: true, ipfsHash, pinataResponse: data, message: 'Proofs unpinned successfully' }, { status: 200 });
    } catch (err: any) {
        console.error('unpinProofs error', err);
        return NextResponse.json({ error: err?.message ?? 'Unknown error' }, { status: 500 });
    }
}