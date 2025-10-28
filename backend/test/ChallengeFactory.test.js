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

        it('should allow to deploy a new challenge contract in GROUP mode', async function() {

            const playersAllowed = [
                [signers[0].address],
                [signers[1].address],
                [signers[2].address],
                [signers[3].address],
                [signers[4].address]
            ]

            const merkleTree = StandardMerkleTree.of(playersAllowed, ["address"]);

            await challengeFactory.createChallenge(1111n, maxPlayers, bid+10n, description, true, merkleTree.root, "ipfsCid");


            // 2. Extract the address from the event
            const filter = challengeFactory.filters.ChallengeCreated;
            const events = await challengeFactory.queryFilter(filter, -1)
            const event = events[1]
            const newContractAddress = event.args.challengeAddress;

            // 3. Attach to the deployed challenge
            const Challenge = await ethers.getContractFactory("Challenge");
            const challenge = Challenge.attach(newContractAddress);

            // Verify initialisation
            const _duration = await challenge.duration();
            const _maxPlayers = await challenge.maxPlayers();
            const _bid = await challenge.bid();
            const _description = await challenge.description();

            expect(_duration).to.equal(1111n);
            expect(_maxPlayers).to.equal(5n);
            expect(_bid).to.equal(bid+10n);
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

    



    describe("ChallengeFactory pagination", function () {

        beforeEach(async function () {

            ({challengeFactory, signers, token } = await loadFixture(deployedChallengeFactoryFixtureBase));

            // Create a bunch of challenges
            this.numChallenges = 7;
            this.created = [];
            const startBlockNumber = (await ethers.provider.getBlock("latest")).number + 1;
            for (let i = 0; i < this.numChallenges; i++) {
                const tx = await challengeFactory.createChallenge(
                    duration,                // duration
                    maxPlayers,                   // maxPlayers
                    bid + BigInt(i),  // bid (just vary slightly)
                    `desc ${i}`,         // description
                    false,               // groupMode
                    ethers.ZeroHash,  // merkleRoot placeholder
                    "ipfsCid" // placeholder for IpfsCid  
                );
                const receipt = await tx.wait();
            }

            //then, create table once after all creations
            const filter = challengeFactory.filters.ChallengeCreated();
            const fromBlock = startBlockNumber; // capture before first create
            const events = await challengeFactory.queryFilter(filter, fromBlock, "latest");
            
            for(let i = 0; i < this.numChallenges; i++) {
                const challengeAddress = events[i].args.challengeAddress; // or evt.args[1]
                this.created.push(challengeAddress);
            }
        });

        it("should return the first batch when count < total", async function () {
            const start = 0;
            const count = 3;
            const list = await challengeFactory.getChallenges(start, count);
            expect(list.length).to.equal(count);
            // first `count` addresses should match
            for (let i = 0; i < count; i++) {
                expect(list[i]).to.equal(this.created[i]);
            }
        });

        it("should return entire list when count >= total-start", async function () {
            const start = 2;
            const count = 10;  // more than remaining
            const list = await challengeFactory.getChallenges(start, count);
            expect(list.length).to.equal(this.numChallenges - start);
            for (let i = start; i < this.numChallenges; i++) {
            expect(list[i - start]).to.equal(this.created[i]);
            }
        });

        it("should return empty array when start >= total", async function () {
            const start = this.numChallenges;  // equals length
            const count = 5;
            const list = await challengeFactory.getChallenges(start, count);
            expect(list.length).to.equal(0);
        });

        it("should return empty if count is zero", async function () {
            const start = 1;
            const count = 0;
            const list = await challengeFactory.getChallenges(start, count);
            expect(list.length).to.equal(0);
        });

        it("should return last element when start = total - 1 and count >=1", async function () {
            const start = this.numChallenges - 1;
            const count = 5;
            const list = await challengeFactory.getChallenges(start, count);
            expect(list.length).to.equal(1);
            expect(list[0]).to.equal(this.created[this.numChallenges - 1]);
        });
    })
})