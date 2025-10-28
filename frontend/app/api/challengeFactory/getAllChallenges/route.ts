import { NextResponse } from "next/server"
import { currentSubgraphURL } from "@/config/networks"

const SUBGRAPH_URL = currentSubgraphURL || "http://localhost:8000/subgraphs/name/challenge"

export async function GET(req: Request) {

  const query = `
    query {
      challengeCreateds(
        orderBy: blockNumber
        orderDirection: desc
      ) {
        id
        admin
        challengeAddress
        blockNumber
        txHash
        createdAt
      }
    }
  `

  try{
    const response = await fetch(SUBGRAPH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query
        })
    })
    const json = await response.json()
    if (json.errors) {
        return NextResponse.json({ error: json.errors }, { status: 500 })
    }
    return NextResponse.json({ data: json.data.challengeCreateds })
  } catch (err) {
    console.error("Failed to fetch challenges:", err);
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }
}
