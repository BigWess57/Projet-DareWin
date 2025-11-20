const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { assert, expect } = require("chai")
const { ethers, network } = require("hardhat")
// const helpers = require("@nomicfoundation/hardhat-network-helpers")
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree")


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
        
        
        return { challengeFactory, signers, token };
    }


    describe("First tests", function (){
        beforeEach(async function () {
            ({challengeFactory, signers, token } = await loadFixture(deployedChallengeFactoryFixtureBase));

            await challengeFactory.createChallenge(duration, maxPlayers, bid, description, 0, ethers.ZeroHash, "ipfsCid");
        });


        it('should just deploy the challenge factory, and create a challenge', async function() {
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
    })

    
    describe("Parameter Validation Tests", function () {
        beforeEach(async function () {
            ({challengeFactory, signers, token } = await loadFixture(deployedChallengeFactoryFixtureBase));
        });

        it('should revert with ZeroAddressToken when token address is zero', async function() {
            const ChallengeFactory = await ethers.getContractFactory('ChallengeFactory');
            await expect(
                ChallengeFactory.deploy("0x0000000000000000000000000000000000000000", signers[0].address)
            ).to.be.revertedWithCustomError(ChallengeFactory, "ZeroAddressToken");
        });
        
        it('should revert with ZeroAddressFeeReceiver when feeReceiver address is zero', async function() {
            const ChallengeFactory = await ethers.getContractFactory('ChallengeFactory');
            await expect(
                ChallengeFactory.deploy(token.target, "0x0000000000000000000000000000000000000000")
            ).to.be.revertedWithCustomError( ChallengeFactory, "ZeroAddressFeeReceiver")
        })

        it('should revert with InvalidDuration when duration is 0', async function() {
            await expect(
                challengeFactory.createChallenge(
                    0n, // Invalid duration
                    maxPlayers,
                    bid,
                    description,
                    false,
                    ethers.ZeroHash,
                    "ipfsCid"
                )
            ).to.be.revertedWithCustomError(challengeFactory, "InvalidDuration");
        });

        it('should revert with InsufficientPlayers when maxPlayers is less than 2', async function() {
            await expect(
                challengeFactory.createChallenge(
                    duration,
                    1n, // Invalid: less than 2
                    bid,
                    description,
                    false,
                    ethers.ZeroHash,
                    "ipfsCid"
                )
            ).to.be.revertedWithCustomError(challengeFactory, "InsufficientPlayers");
        });

        it('should revert with InsufficientPlayers when maxPlayers is 0', async function() {
            await expect(
                challengeFactory.createChallenge(
                    duration,
                    0n, // Invalid: 0 players
                    bid,
                    description,
                    false,
                    ethers.ZeroHash,
                    "ipfsCid"
                )
            ).to.be.revertedWithCustomError(challengeFactory, "InsufficientPlayers");
        });

        it('should revert with InsufficientBid when bid is 0', async function() {
            await expect(
                challengeFactory.createChallenge(
                    duration,
                    maxPlayers,
                    0n, // Invalid bid
                    description,
                    false,
                    ethers.ZeroHash,
                    "ipfsCid"
                )
            ).to.be.revertedWithCustomError(challengeFactory, "InsufficientBid");
        });
    });

    describe("Group Mode Tests", function () {
        beforeEach(async function () {
            ({challengeFactory, signers, token } = await loadFixture(deployedChallengeFactoryFixtureBase));
        });

        
        it('should create challenge with groupMode false and zero merkle root', async function() {
            await expect(
                challengeFactory.createChallenge(
                    duration,
                    maxPlayers,
                    bid,
                    description,
                    false, // groupMode = false
                    ethers.ZeroHash,
                    "ipfsCid"
                )
            ).to.emit(challengeFactory, 'ChallengeCreated');
        });
    })
})