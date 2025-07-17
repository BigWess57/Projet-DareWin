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

    // const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
    // const REGISTRAR = "0x6B0B234fB2f380309D47A7E9391E29E9a179395a";

    //Just deployment (base state)
    async function deployedChallengeFactoryFixtureBase() {
        const signers = await ethers.getSigners();
        const ChallengeFactory = await ethers.getContractFactory('ChallengeFactory');

        //Token deployment + Funding players (for setup)^
        const DareWinToken = await ethers.getContractFactory('DareWin');
        const token = await DareWinToken.deploy(signers[0].address);
        
        //  // Impersonate un compte riche en LINK via le fork
        // const richHolder = "0x841ed663F2636863D40be4EE76243377dff13a34"; // adresse connue avec LINK
        // await network.provider.request({
        //     method: "hardhat_impersonateAccount",
        //     params: [richHolder],
        // });
        // const richSigner = await ethers.getSigner(richHolder);


        const challengeFactory = await ChallengeFactory.deploy(token.target, signers[0].address/*, LINK, REGISTRAR*/);
       // await challengeFactory.waitForDeployment(); 

        // Le richHolder approuve le registrar  our LINK
        // const linkContract = await ethers.getContractAt("IERC20", LINK);
        // await linkContract.connect(richSigner).approve(REGISTRAR, ethers.parseUnits("0.1"));

        // const approved = await linkContract.allowance(richSigner, REGISTRAR)
        // console.log("Allowance before:", ethers.formatEther(approved));

        // const code = await ethers.provider.getCode(REGISTRAR);
        // console.log("Registrar code:", code.length);
        // expect(code).to.not.equal("0x");

        await challengeFactory.createChallenge(duration, maxPlayers, bid, description, 0, []);

        // Log pour vérifier
// console.log("Factory deployed at:", challengeFactory.target);
// console.log("Rich signer address:", richSigner.address);

        // await expect(
            // await challengeFactory
            //     .connect(richSigner).createChallenge.staticCall(duration, maxPlayers, bid, description, 0, [])
        // ).to.be.revertedWith("You must fund the registrar"); 
        
        return { challengeFactory, signers };
    }

    beforeEach(async function () {
        ({challengeFactory, signers } = await loadFixture(deployedChallengeFactoryFixtureBase));
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
        // expect(args.to).to.equal(receiver.address)
        // expect(args.value).to.equal(amount)
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

    //Automation tests
    // it('should verify that the registration of the upkeep has been done', async function() {
    //     // Vérifie dans les logs que l’enregistrement s’est bien fait
    //     const log = receipt.logs.find(l => l.address.toLowerCase() === REGISTRAR.toLowerCase());
    //     expect(log).to.not.be.undefined;
    // })

    // it('should be able to create a challenge successfully, and automatically end it when all the users have voted (with chainlink)', async function() {
    //     //Players approve the right for the contract to use their tokens
    //     await token.approve(challenge.target, bid);
    //     await token.connect(signers[1]).approve(challenge.target, bid);
    //     await token.connect(signers[2]).approve(challenge.target, bid);
    //     await token.connect(signers[3]).approve(challenge.target, bid);
    //     await token.connect(signers[4]).approve(challenge.target, bid);

    //     //5 players join
    //     await challenge.joinChallenge();
    //     await challenge.connect(signers[1]).joinChallenge();
    //     await challenge.connect(signers[2]).joinChallenge();
    //     await challenge.connect(signers[3]).joinChallenge();
    //     await challenge.connect(signers[4]).joinChallenge();

    //     //Admin starts the challenge
    //     await challenge.startChallenge();

    //     //Pass enough time
    //     await time.increase(duration)

    //     //Everyone votes
    //     await challenge.voteForWinner(signers[1].address)
    //     await challenge.connect(signers[1]).voteForWinner(signers[1].address) 
    //     await challenge.connect(signers[2]).voteForWinner(signers[2].address) 
    //     await challenge.connect(signers[3]).voteForWinner(signers[1].address) 
    //     await challenge.connect(signers[4]).voteForWinner(signers[2].address)
    // })

})