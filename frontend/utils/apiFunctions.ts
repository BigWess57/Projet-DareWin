//File containing functions calling API router from next

// call GraphQL subgraph to retrieve created Challenges
export const retrieveChallenges = async (URL: string) => {
    const res = await fetch(URL);
    if (!res.ok) {
        const errorText = await res.text(); // get the raw response body
        console.error("Failed to fetch challenges:", errorText);
        throw new Error(
            `Failed to fetch challenges: ${res.status} ${res.statusText}`,
        );
    }
    const { data: Challenges } = await res.json();

    return Challenges;
};

export type PlayerEvent = {
    player: string;
    eventType: "PlayerJoined" | "PlayerWithdrawn";
};

// call GraphQL subgraph to retrieve players from challenge (all, voted...), depending on request
export const getPlayers = async (URL: string): Promise<PlayerEvent[]> => {
    const res = await fetch(URL);
    if (!res.ok) {
        const errorText = await res.text(); // get the raw response body
        console.error("Failed to fetch Players:", errorText);
        // throw new Error(`Failed to fetch Players: ${res.status} ${res.statusText}`);
    }
    const { data: Players } = await res.json();

    return Players;
};

//Unpin the merkle proofs for joining the challenge, if
export const attemptUnpin = async (
    cid: string,
): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await fetch("/api/ipfsProofs/unpinProofs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cid }),
        });
        const json = await res.json();
        if (!res.ok) {
            console.error("Unpin failed", json);
            return { success: false, message: json?.error ?? res.statusText };
        } else {
            console.log(json?.message ?? "Unpinned (or not pinned)");
        }
        return { success: true, message: "" };
    } catch (_err) {
        throw new Error("Network error");
    }
};
