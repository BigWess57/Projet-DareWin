import {
  ChallengeCreated as ChallengeCreatedEvent,
  ChallengeFactoryNew
} from "../generated/ChallengeFactoryNew/ChallengeFactoryNew"
import {
  ChallengeCreated
} from "../generated/schema"

export function handleChallengeCreated(event: ChallengeCreatedEvent): void {
  // Unique ID per event: txHash + logIndex
  let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  let entity = new ChallengeCreated(id)

  // event params as defined in the ABI
  entity.admin = event.params.admin
  entity.challengeAddress = event.params.challengeAddress
  entity.blockNumber = event.params.blockNumber

  // metadata
  entity.txHash = event.transaction.hash
  entity.createdAt = event.block.timestamp

  entity.save()
}
