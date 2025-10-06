import {
  ChallengeCreated as ChallengeCreatedEvent,
  ChallengeFactoryNew
} from "../generated/ChallengeFactoryNew/ChallengeFactoryNew"
import {
  ChallengeCreated
} from "../generated/schema"
import { ChallengeTemplate } from "../generated/templates" // auto-generated template import
import { log } from "@graphprotocol/graph-ts"

export function handleChallengeCreated(event: ChallengeCreatedEvent): void {
  // Unique ID per event: txHash + logIndex
  let id = event.params.challengeAddress.toHex();
  log.info("handleChallengeCreated called for challengeId: {}", [id])

  let entity = new ChallengeCreated(id)

  // event params as defined in the ABI
  entity.admin = event.params.admin
  entity.challengeAddress = event.params.challengeAddress
  entity.blockNumber = event.params.blockNumber

  // metadata
  entity.txHash = event.transaction.hash
  entity.createdAt = event.block.timestamp

  entity.save()

  // Instantiate dynamic template so this challenge's events will be indexed
  ChallengeTemplate.create(event.params.challengeAddress)
  log.info("ChallengeTemplate created for {}", [id])
}
