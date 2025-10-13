//File containing functions calling API router from next

// call GraphQL subgraph to retrieve created Challenges
export const retrieveChallenges = async (URL : string) => {
    const res = await fetch(URL);
    if (!res.ok) {
        const errorText = await res.text(); // get the raw response body
        console.error("Failed to fetch challenges:", errorText);
        throw new Error(`Failed to fetch challenges: ${res.status} ${res.statusText}`);
    }
    const { data: Challenges } = await res.json();

    Challenges.forEach((challenge: any) => {
        // console.log(log)
        console.log("Challenge ID:", challenge.id, "by admin:", challenge.admin);
    });
    return Challenges;
}


// call GraphQL subgraph to retrieve players from challenge (all, voted...), depending on request
export const getPlayers = async (URL : string) => {
    const res = await fetch(URL);
    if (!res.ok) {
        const errorText = await res.text(); // get the raw response body
        console.error("Failed to fetch Players:", errorText);
        // throw new Error(`Failed to fetch Players: ${res.status} ${res.statusText}`);
    }
    const { data: Players } = await res.json();

    // Players.forEach((player: any) => {
    //     console.log("Player : ", player);
    // });
    return Players;
}


