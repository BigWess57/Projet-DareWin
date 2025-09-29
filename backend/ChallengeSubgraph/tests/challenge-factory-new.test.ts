import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { ChallengeCreated } from "../generated/schema"
import { ChallengeCreated as ChallengeCreatedEvent } from "../generated/ChallengeFactoryNew/ChallengeFactoryNew"
import { handleChallengeCreated } from "../src/challenge-factory-new"
import { createChallengeCreatedEvent } from "./challenge-factory-new-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let admin = Address.fromString("0x0000000000000000000000000000000000000001")
    let challengeAddress = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let blockNumber = BigInt.fromI32(234)
    let newChallengeCreatedEvent = createChallengeCreatedEvent(
      admin,
      challengeAddress,
      blockNumber
    )
    handleChallengeCreated(newChallengeCreatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("ChallengeCreated created and stored", () => {
    assert.entityCount("ChallengeCreated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "ChallengeCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "admin",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "ChallengeCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "challengeAddress",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "ChallengeCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "blockNumber",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
