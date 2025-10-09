import { NextResponse } from "next/server"

const SUBGRAPH_URL = process.env.SUBGRAPH_URL || "http://localhost:8000/subgraphs/name/challenge"

type GQLPlayerEvent = {
  id: string;
  player: string;
  timestamp: string | number;
};

export async function GET(req: Request) {

    const { searchParams } = new URL(req.url)
    const challengeAddress = searchParams.get("address") || ""

    const query = `
      query($challengeAddress: ID!) {
        playerJoineds(
          where: { challenge: $challengeAddress }
          orderBy: timestamp
          orderDirection: desc
        ) {
          id
          player
          timestamp
        }

        playerWithdrawns(
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

        const joined: GQLPlayerEvent[] = json.data?.playerJoineds ?? [];
        const withdrawn: GQLPlayerEvent[] = json.data?.playerWithdrawns ?? [];
        
        // Map playerAddress(lowercase) -> { joins, withdraws, lastJoinTs, lastWithdrawTs }
        const stats = new Map<
            string,
            { joins: number; withdraws: number; lastJoinTs: number; lastWithdrawTs: number }
        >();

        const toNum = (v: string | number) => {
            const n = typeof v === "number" ? v : parseInt(String(v), 10);
            return Number.isFinite(n) ? n : 0;
        };

        for (const e of joined) {
            const addr = e.player.toLowerCase();
            const ts = toNum(e.timestamp);
            const cur = stats.get(addr) ?? { joins: 0, withdraws: 0, lastJoinTs: 0, lastWithdrawTs: 0 };
            cur.joins += 1;
            if (ts > cur.lastJoinTs) cur.lastJoinTs = ts;

            stats.set(addr, cur);
        }

        for (const e of withdrawn) {
            const addr = e.player.toLowerCase();
            const ts = toNum(e.timestamp);
            const cur = stats.get(addr) ?? { joins: 0, withdraws: 0, lastJoinTs: 0, lastWithdrawTs: 0 };
            cur.withdraws += 1;
            if (ts > cur.lastWithdrawTs) cur.lastWithdrawTs = ts;

            stats.set(addr, cur);
        }

        // Determine currently-present players:
        // primary rule: joins > withdraws -> present
        // (This matches your specification: equal => not present)
        // We return canonical checksum-lowercased addresses (lowercase) as plain strings.
        const presentPlayers: string[] = [];
        for (const [addr, s] of stats.entries()) {
            if (s.joins > s.withdraws) {
                presentPlayers.push(addr);
            }
        }

        // Optionally: sort by last join timestamp descending (most recently joined first)
        presentPlayers.sort((a, b) => {
            const aTs = stats.get(a)?.lastJoinTs ?? 0;
            const bTs = stats.get(b)?.lastJoinTs ?? 0;
            return bTs - aTs;
        });


        return NextResponse.json({ data: presentPlayers })
    } catch (err) {
        console.error("Failed to fetch challenge Players:", err);
        return NextResponse.json({ error: "Failed to fetch challenge Players" }, { status: 500 });
    }
}
