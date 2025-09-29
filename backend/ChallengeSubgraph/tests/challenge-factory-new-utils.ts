import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import { ChallengeCreated } from "../generated/ChallengeFactoryNew/ChallengeFactoryNew"

export function createChallengeCreatedEvent(
  admin: Address,
  challengeAddress: Address,
  blockNumber: BigInt
): ChallengeCreated {
  let challengeCreatedEvent = changetype<ChallengeCreated>(newMockEvent())

  challengeCreatedEvent.parameters = new Array()

  challengeCreatedEvent.parameters.push(
    new ethereum.EventParam("admin", ethereum.Value.fromAddress(admin))
  )
  challengeCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "challengeAddress",
      ethereum.Value.fromAddress(challengeAddress)
    )
  )
  challengeCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "blockNumber",
      ethereum.Value.fromUnsignedBigInt(blockNumber)
    )
  )

  return challengeCreatedEvent
}
