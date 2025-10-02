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
import { store, log } from "@graphprotocol/graph-ts"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {

  // beforeAll(() => {
  //   let admin = Address.fromString("0x0000000000000000000000000000000000000001") 
  //   let challengeAddress = Address.fromString( "0x0000000000000000000000000000000000000001" ) 
  //   let blockNumber = BigInt.fromI32(234) 

  //   let newChallengeCreatedEvent = createChallengeCreatedEvent( 
  //     admin, 
  //     challengeAddress, 
  //     blockNumber 
  //   ) 
  //   handleChallengeCreated(newChallengeCreatedEvent)
  // })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("ChallengeCreated created and stored", () => {
    let admin = Address.fromString("0x0000000000000000000000000000000000000001") 
    let challengeAddress = Address.fromString( "0x0000000000000000000000000000000000000001" ) 
    let blockNumber = BigInt.fromI32(234) 

    let newChallengeCreatedEvent = createChallengeCreatedEvent( 
      admin, 
      challengeAddress, 
      blockNumber 
    ) 
    handleChallengeCreated(newChallengeCreatedEvent)

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


  test("Can store multiple ChallengeCreated events", () => {

    clearStore()

    let admins = [
      Address.fromString("0x0000000000000000000000000000000000000001"),
      Address.fromString("0x0000000000000000000000000000000000000002")
    ]
    let challenges = [
      Address.fromString("0x0000000000000000000000000000000000000001"),
      Address.fromString("0x0000000000000000000000000000000000000002")
    ]
    let blocks = [BigInt.fromI32(100), BigInt.fromI32(101)]

    for (let i = 0; i < 2; i++) {
      let event = createChallengeCreatedEvent(
        admins[i],
        challenges[i],
        blocks[i],
        i
      )
      handleChallengeCreated(event)
    }

    // let entity1 = store.get("ChallengeCreated", "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1")
    // if (entity1) {
    //   let admin = entity1.get("admin")!.toAddress().toHexString()
    //   let challengeAddress = entity1.get("challengeAddress")!.toAddress().toHexString()
    //   let blockNumber = entity1.get("blockNumber")!.toBigInt().toString()
    //   log.info("Entity 1 - admin: {}, challengeAddress: {}, blockNumber: {}", [
    //     admin,
    //     challengeAddress,
    //     blockNumber
    //   ])
    // } else {
    //   log.info("Entity 1 not found", [])
    // }
    
    // let entity2 = store.get("ChallengeCreated", "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-0")
    // if (entity2) {
    //   let admin = entity2.get("admin")!.toAddress().toHexString()
    //   let challengeAddress = entity2.get("challengeAddress")!.toAddress().toHexString()
    //   let blockNumber = entity2.get("blockNumber")!.toBigInt().toString()
    //   log.info("Entity 2 - admin: {}, challengeAddress: {}, blockNumber: {}", [
    //     admin,
    //     challengeAddress,
    //     blockNumber
    //   ])
    // } else {
    //   log.info("Entity 2 not found", [])
    // }

    assert.entityCount("ChallengeCreated", 2)

    // Check first event
    assert.fieldEquals(
      "ChallengeCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-0",
      "admin",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "ChallengeCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-0",
      "challengeAddress",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "ChallengeCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-0",
      "blockNumber",
      "100"
    )

    // Check second event
    assert.fieldEquals(
      "ChallengeCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "admin",
      "0x0000000000000000000000000000000000000002"
    )
    assert.fieldEquals(
      "ChallengeCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "challengeAddress",
      "0x0000000000000000000000000000000000000002"
    )
    assert.fieldEquals(
      "ChallengeCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "blockNumber",
      "101"
    )
  })


  test("Retrieve ChallengeCreated entity by ID", () => {
    clearStore()

    let admin = Address.fromString("0x1111111111111111111111111111111111111111")
    let challengeAddress = Address.fromString("0x2222222222222222222222222222222222222222")
    let blockNumber = BigInt.fromI32(123)

    let event = createChallengeCreatedEvent(admin, challengeAddress, blockNumber)
    handleChallengeCreated(event)

    let id = event.transaction.hash.toHex() + "-" + event.logIndex.toString()

    // Fetch entity directly
    let entity = store.get("ChallengeCreated", id)
    assert.assertNotNull(entity, "Entity should exist in the store")
  })


  test("Store multiple events with same admin but different challenges", () => {
    clearStore()

    let admin = Address.fromString("0x3333333333333333333333333333333333333333")
    let challenges = [
      Address.fromString("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
      Address.fromString("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
    ]
    let blocks = [BigInt.fromI32(200), BigInt.fromI32(201)]

    for (let i = 0; i < 2; i++) {
      let event = createChallengeCreatedEvent(admin, challenges[i], blocks[i], i)
      handleChallengeCreated(event)
    }

    assert.entityCount("ChallengeCreated", 2)
    assert.fieldEquals(
      "ChallengeCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "challengeAddress",
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    )
    assert.fieldEquals(
      "ChallengeCreated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-0",
      "challengeAddress",
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    )
  })

})
