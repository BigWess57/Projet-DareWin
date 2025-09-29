import { ChallengeCreated as ChallengeCreatedEvent } from "../generated/ChallengeFactoryNew/ChallengeFactoryNew"
import { ChallengeCreated } from "../generated/schema"

export function handleChallengeCreated(event: ChallengeCreatedEvent): void {
  let entity = new ChallengeCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.admin = event.params.admin
  entity.challengeAddress = event.params.challengeAddress
  entity.blockNumber = event.params.blockNumber

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
