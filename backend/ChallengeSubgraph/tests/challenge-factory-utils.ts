import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { ChallengeCreated } from "../generated/ChallengeFactory/ChallengeFactory"

export function createChallengeCreatedEvent(
  admin: Address,
  challengeAddress: Address,
  timestamp: BigInt,
  // logIndex: i32 = 1
): ChallengeCreated {
  // Create a new mock event
  // let mockEvent = newMockEvent()
  // mockEvent.logIndex = BigInt.fromI32(logIndex)
  
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
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  )

  return challengeCreatedEvent
}
