import {
  PlayerJoined as PlayerJoinedEvent,
  PlayerWithdrawn as PlayerWithdrawnEvent,
  PlayerVoted as PlayerVotedEvent,
} from "../generated/templates/ChallengeTemplate/Challenge"
import {
  PlayerJoined,
  PlayerWithdrawn,
//   PlayerVoted,
  ChallengeCreated
} from "../generated/schema"



export function handlePlayerJoined(event: PlayerJoinedEvent): void {
    // Maybe filter only for challenges created by your factory (if needed)
    // Then save a PlayerJoined entity, linking to the challenge
    let challengeId = event.address.toHex(); // address of emitting contract
    let challenge = ChallengeCreated.load(challengeId)
    if (challenge == null) {
        // depending on your situation, create a placeholder,
        // or skip indexing until parent exists.
        return
    }

    let id = event.block.number.toString() + "-" + event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    let pj = new PlayerJoined(id)
    pj.challenge = challengeId           // relation (string id)
    // pj.challengeAddress = event.address  // bytes duplicate
    pj.player = event.params.player
    pj.timestamp = event.block.timestamp
    pj.save()
}

export function handlePlayerWithdrawn(event: PlayerWithdrawnEvent): void {
    let challengeId = event.address.toHex(); // address of emitting contract
    let challenge = ChallengeCreated.load(challengeId)
    if (challenge == null) {
        return
    }

    let id = event.block.number.toString() + "-" + event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    let pw = new PlayerWithdrawn(id)
    pw.challenge = challengeId
    pw.player = event.params.player
    pw.timestamp = event.block.timestamp
    pw.save()
}

// export function handlePlayerVoted(event: PlayerVotedEvent): void {
//     let challengeId = event.address.toHex(); // address of emitting contract
//     let challenge = ChallengeCreated.load(challengeId)
//     if (challenge == null) {
//         return
//     }

//     let id = event.block.number.toString() + "-" + event.transaction.hash.toHex() + "-" + event.logIndex.toString()
//     let pv = new PlayerVoted(id)
//     pv.challenge = challengeId
//     pv.player = event.params.voter
//     pv.votedFor = event.params.votedFor
//     pv.timestamp = event.block.timestamp
//     pv.save()
// }