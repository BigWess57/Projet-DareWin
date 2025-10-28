import { NextResponse } from "next/server"
import { currentSubgraphURL } from "@/config/networks"

const SUBGRAPH_URL = currentSubgraphURL || "http://localhost:8000/subgraphs/name/challenge"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const admin = searchParams.get("admin") || ""

  const query = `
    query($admin: String) {
      challengeCreateds(
        where: { admin: $admin }
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        admin
        challengeAddress
        timestamp
        txHash
        createdAt
      }
    }
  `

  const variables = { admin: admin?.toLowerCase() };

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
    return NextResponse.json({ data: json.data.challengeCreateds })
  } catch (err) {
    console.error("Failed to fetch challenges:", err);
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 });
  }
}
