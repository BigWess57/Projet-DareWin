import { NextResponse } from "next/server"

const SUBGRAPH_URL = process.env.SUBGRAPH_URL || "http://localhost:8000/subgraphs/name/challenge"


export async function GET(req: Request) {

    const { searchParams } = new URL(req.url)
    const challengeAddress = searchParams.get("address") || ""

    const query = `
      query($challengeAddress: ID!) {
        playerVoteds(
          where: { challenge: $challengeAddress }
          orderBy: timestamp
          orderDirection: desc
        ) {
          id
          player
          timestamp
        }
      }
    `;

    const variables = { challengeAddress: challengeAddress?.toLowerCase() };

    try{
        const response = await fetch(SUBGRAPH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query, variables
            })
        })
        const json = await response.json()
        if (json.errors) {
            return NextResponse.json({ error: json.errors }, { status: 500 })
        }

        const voted = json.data?.playerVoteds?.map((p: any) => p.player) ?? [];

        return NextResponse.json({ data: voted })
    } catch (err) {
        console.error("Failed to fetch challenge Players:", err);
        return NextResponse.json({ error: "Failed to fetch challenge Players" }, { status: 500 });
    }
}
