const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { assert, expect } = require("chai")
const { ethers, network } = require("hardhat")
// const helpers = require("@nomicfoundation/hardhat-network-helpers")

const { durationSlot, maxPlayersSlot, bidSlot } = require("./utils/constants");

describe("tests ChallengeFactory contract", function () {

    const duration = 1000n;
    const maxPlayers = 5n;
    const bid = ethers.parseEther("1");
    const description = "test";

    //Just deployment (base state)
    async function deployedChallengeFactoryFixtureBase() {
        const signers = await ethers.getSigners();
        const ChallengeFactory = await ethers.getContractFactory('ChallengeFactory');

        //Token deployment + Funding players (for setup)^
        const DareWinToken = await ethers.getContractFactory('DareWin');
        const token = await DareWinToken.deploy(signers[0].address);


        const challengeFactory = await ChallengeFactory.deploy(token.target, signers[0].address);


        await challengeFactory.createChallenge(duration, maxPlayers, bid, description, 0, []);
        
        return { challengeFactory, signers, token };
    }

    beforeEach(async function () {
        ({challengeFactory, signers, token } = await loadFixture(deployedChallengeFactoryFixtureBase));
    });

    it('should just deploy the challenge factory, and create a challenge', async function() {
    })

    it('should should not be possible to deploy with a feeReceiver address to 0', async function() {
        const ChallengeFactory = await ethers.getContractFactory('ChallengeFactory');
        await expect(
            ChallengeFactory.deploy(token.target, "0x0000000000000000000000000000000000000000")
        ).to.be.revertedWith("the feeReceiver cannot be address 0!")
    })

    it('should emit an event on new challenge deployment', async function() {

        const filter = challengeFactory.filters.ChallengeCreated(signers[0].address);
        const events = await challengeFactory.queryFilter(filter, -1)
        const event = events[0]

        expect(event.fragment.name).to.equal('ChallengeCreated')

        const args = event.args
        expect(args.admin).to.equal(signers[0].address)
    })

    it('should allow to deploy a new challenge contract', async function() {

        // 2. Extract the address from the event
        const filter = challengeFactory.filters.ChallengeCreated;
        const events = await challengeFactory.queryFilter(filter, -1)
        const event = events[0]
        const newContractAddress = event.args.challengeAddress;

        // 3. Attach to the deployed challenge
        const Challenge = await ethers.getContractFactory("Challenge");
        const challenge = Challenge.attach(newContractAddress);

        // Verify initialisation
        const _duration = await challenge.duration();
        const _maxPlayers = await challenge.maxPlayers();
        const _bid = await challenge.bid();
        const _description = await challenge.description();

        expect(_duration).to.equal(1000n);
        expect(_maxPlayers).to.equal(5n);
        expect(_bid).to.equal(bid);
        expect(_description).to.equal("test")

    })

    it('should set the caller of the function createChallenge as owner of the challenge', async function() {

        // 2. Extract the address from the event
        const filter = challengeFactory.filters.ChallengeCreated;
        const events = await challengeFactory.queryFilter(filter, -1)
        const event = events[0]
        const newContractAddress = event.args.challengeAddress;

        // 3. Attach to the deployed challenge
        const Challenge = await ethers.getContractFactory("Challenge");
        const challenge = Challenge.attach(newContractAddress);

        const owner = await challenge.owner()

        expect(owner).to.equal(signers[0].address)

    })

    it('should be possible to access to all challenges previously created ', async function() {
        // 1. Call factory to create 2 more challenge contracts
        await challengeFactory.createChallenge(duration, maxPlayers, bid, description, 0, []);
        await challengeFactory.createChallenge(duration, maxPlayers, bid, description, 0, []);

        // 2. Extract the addresses from the events
        const filter = challengeFactory.filters.ChallengeCreated;
        const events = await challengeFactory.queryFilter(filter, 0, "latest")
        const addresses = events.map((event) => event.args.challengeAddress);
        // console.log("deployed contract addresses : ", addresses)

        //Contract ABI
        const Challenge = await ethers.getContractFactory("Challenge");

        for (const addr of addresses) {
            const challengeContract = Challenge.attach(addr);

            // Now you can call read-only functions to confirm it's really a deployed contract of this type
            const _duration = await challengeContract.duration();

            expect(_duration).to.equal(1000n); // simple check that contract responds
        }
    })

    

})