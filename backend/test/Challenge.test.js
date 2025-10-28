const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai")
const { ethers } = require("hardhat")
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree")


describe("tests Challenge contract", function () {

/**************  Starting fixtures ****************/ 

    //Important Global variables
    const votingDelay = 10000;
    const duration = 1000n;
    const maxPlayers = 5n;
    const description = "test";

    //Fee tier (used to divide)
    const bronze = 5n; //5 % (<10000 tokens)
    const silver = 4n; //4 % (>10000 and <40000 tokens)
    const gold = 3n; //3 % (>40000 and <100000 tokens)
    const platinum = 2n; //2 % (>100000 tokens)


    async function getTimestampPlusOneHourInSeconds() {
        // returns current timestamp in seconds
        // return Math.floor(Date.now() / 1000);
        const latestBlock = await ethers.provider.getBlock('latest');
        const now = latestBlock.timestamp;            // already in seconds (BigInt or number)
        return Number(now) + 3600;
    }


    //Just deployment (base state)
    
    async function deployedChallengeFixtureBase(mode = "link") {
        const signers = await ethers.getSigners();

        //Token deployment + Funding players (for setup)^
        const DareWinToken = await ethers.getContractFactory('DareWin');
        const token = await DareWinToken.deploy(signers[0].address);

        //send 1000 tokens to 4 signers
        const amountToDistribute = ethers.parseUnits("1000", await token.decimals());
        for (let i = 1; i < 6; i++) {
            await token.transfer(signers[i].address, amountToDistribute);
            const bal = await token.balanceOf(signers[i].address);
            // console.log(ethers.formatUnits(bal, await dareWinToken.decimals()))
            expect(bal).to.equal(amountToDistribute);
        }

        //Send a bit more to 2nd signer
        await token.transfer(signers[1].address, ethers.parseUnits("50000", await token.decimals()));

        const bid = ethers.parseUnits("1000", await token.decimals());

        //Challenge Deployment
        const Challenge = await ethers.getContractFactory('Challenge'); 

        let challenge;
        let merkleTree;
        if(mode == "link"){
            challenge = await Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, false, ethers.ZeroHash, "ipfsCid");
        }else if(mode == "group"){
            //Make merkle tree from players array
            //array of players to store (for merkle root)
            const playersAllowed = [
                [signers[0].address],
                [signers[1].address],
                [signers[2].address],
                [signers[3].address],
                [signers[4].address]
            ]

            merkleTree = StandardMerkleTree.of(playersAllowed, ["address"]);

            challenge = await Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, true, merkleTree.root, "ipfsCid");
        }

        return { challenge, signers, token, bid, merkleTree };
    }

    //Ongoing challenge (LINK MODE)
    async function OngoingChallengeFixture() {
        //Use the previous function (to not write duplicate code)
        const { challenge, signers, token, bid } = await deployedChallengeFixtureBase();

        //5 players join
        const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);
        const { v: v2, r: r2, s: s2, deadline: deadline2 } = await GetRSVsig(signers[1], token, bid, challenge);
        const { v: v3, r: r3, s: s3, deadline: deadline3 } = await GetRSVsig(signers[2], token, bid, challenge);
        const { v: v4, r: r4, s: s4, deadline: deadline4 } = await GetRSVsig(signers[3], token, bid, challenge);
        const { v: v5, r: r5, s: s5, deadline: deadline5 } = await GetRSVsig(signers[4], token, bid, challenge);
        
        await challenge.joinChallenge(deadline1, v1, r1, s1, []);
        await challenge.connect(signers[1]).joinChallenge(deadline2, v2, r2, s2, []);
        await challenge.connect(signers[2]).joinChallenge(deadline3, v3, r3, s3, []);
        await challenge.connect(signers[3]).joinChallenge(deadline4, v4, r4, s4, []);
        await challenge.connect(signers[4]).joinChallenge(deadline5, v5, r5, s5, []);

        await challenge.startChallenge();
        return { challenge, signers, token, bid };
    }

    //Voting for winner
    async function VotingForWinnerFixture() {
        //Use the previous function (to not write duplicate code)
        const { challenge, signers, token, bid } = await OngoingChallengeFixture();

        //Pass enough time
        await time.increase(duration)
        
        return { challenge, signers, token, bid };
    }

    //Ending the vote
    async function EndingVoteFixture() {
        //Use the previous function (to not write duplicate code)
        const { challenge, signers, token, bid } = await VotingForWinnerFixture();

        await challenge.voteForWinner(signers[1].address)
        await challenge.connect(signers[1]).voteForWinner(signers[1].address) 
        await challenge.connect(signers[2]).voteForWinner(signers[2].address) 
        await challenge.connect(signers[3]).voteForWinner(signers[1].address) 
        await challenge.connect(signers[4]).voteForWinner(signers[2].address) 

        return { challenge, signers, token, bid };
    }

    //declaration de la variable d'etat
    const ChallengeStatus = {
      GatheringPlayers: 0,
      OngoingChallenge: 1,
      VotingForWinner: 2,
      ChallengeWon: 3,
    };




    //Helper function for permit
    async function GetRSVsig(signer, token, bid, challenge) {
        //For permit
        // set token deadline
        const deadline = await getTimestampPlusOneHourInSeconds();
    
        // get the current nonce for the deployer address
        const nonces = await token.nonces(signer.address);
        const chain = await ethers.provider.getNetwork();

        // set the domain parameters
        const domain = {
            name: await token.name(),
            version: "1",
            chainId: chain.chainId,
            verifyingContract: token.target
        };
    
        // set the Permit type parameters
        const types = {
            Permit: [{
                    name: "owner",
                    type: "address"
                },
                {
                    name: "spender",
                    type: "address"
                },
                {
                    name: "value",
                    type: "uint256"
                },
                {
                    name: "nonce",
                    type: "uint256"
                },
                {
                    name: "deadline",
                    type: "uint256"
                },
            ],
        };


        // set the Permit type values
        const values = {
            owner: signer.address,
            spender: challenge.target,
            value: bid,
            nonce: nonces,
            deadline: deadline,
        };

        // sign the Permit type data with the deployer's private key
        const signature = await signer.signTypedData(domain, types, values);

        // split the signature into its components
        const sig = ethers.Signature.from(signature)

        const v = sig.v ?? (27 + sig.yParity); // 27/28

        return  {
            v,
            r: sig.r,
            s: sig.s,
            deadline,
        };
    }


/**************  TESTS ****************/

    describe('deployment', function() { 
        let challenge;
        let signers;
        let bid;
        let token;
        beforeEach(async function () {
            signers = await ethers.getSigners();

            //Token deployment
            const DareWinToken = await ethers.getContractFactory('DareWin');
            token = await DareWinToken.deploy(signers[0].address);

            bid = ethers.parseUnits("1000", await token.decimals());
        });

        it('should juste deploy the contract', async function() { 
            
            //Challenge Deployment
            const Challenge = await ethers.getContractFactory('Challenge'); 

            await expect(
                Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, false, ethers.ZeroHash, "ipfsCid")
            ).to.not.be.reverted
        })

        it('should juste deploy the contract in Group mode', async function() { 
            
            const playersAllowed = [
                [signers[0].address],
                [signers[1].address],
                [signers[2].address],
                [signers[3].address],
                [signers[4].address]
            ]

            merkleTree = StandardMerkleTree.of(playersAllowed, ["address"]);

            const Challenge = await ethers.getContractFactory('Challenge');

            //Challenge Deployment
            await expect(
                challenge = await Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, true, merkleTree.root, "ipfsCid")
            ).to.not.be.reverted
        })

        it('should not be possible to deploy with a feeReceiver address to 0', async function() { 
            //Challenge Deployment
            const Challenge = await ethers.getContractFactory('Challenge'); 

            await expect(
                Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, "0x0000000000000000000000000000000000000000", false, ethers.ZeroHash, "ipfsCid")
            ).to.be.revertedWith("the feeReceiver cannot be address 0!")
        })

        it('GROUP MODE : should not be possible to deploy if the merkle root is 0', async function() { 
            //Challenge Deployment
            const Challenge = await ethers.getContractFactory('Challenge'); 

            await expect(
                Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, true, ethers.ZeroHash, "ipfsCid")
            ).to.be.revertedWith("Merkle root required when groupMode is true")
        })

    })




    describe('gathering players state', function() { 
        let challenge;
        let signers;
        let bid;
        let token;
        beforeEach(async function () {
            ({challenge, signers, bid, token} = await loadFixture(deployedChallengeFixtureBase));
        });

        it('should allow a player to join, and sends the money to the challenge contract correctly', async function() {
            const { v, r, s, deadline } = await GetRSVsig(signers[0], token, bid, challenge);

            expect(
                await token.balanceOf(challenge)
            ).to.equal(0)

            await expect(
                challenge.joinChallenge(deadline, v, r, s, [])
            )
            .to.not.be.reverted;
            
            expect(
                await token.balanceOf(challenge)
            ).to.equal(bid)
        })       

        it('FOR LINK MODE : should not allow any more participants to join if the max is already reached', async function() {
            const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);
            const { v: v2, r: r2, s: s2, deadline: deadline2 } = await GetRSVsig(signers[1], token, bid, challenge);
            const { v: v3, r: r3, s: s3, deadline: deadline3 } = await GetRSVsig(signers[2], token, bid, challenge);
            const { v: v4, r: r4, s: s4, deadline: deadline4 } = await GetRSVsig(signers[3], token, bid, challenge);
            const { v: v5, r: r5, s: s5, deadline: deadline5 } = await GetRSVsig(signers[4], token, bid, challenge);
            const { v: v6, r: r6, s: s6, deadline: deadline6 } = await GetRSVsig(signers[5], token, bid, challenge);
            await challenge.joinChallenge(deadline1, v1, r1, s1, []);
            await challenge.connect(signers[1]).joinChallenge(deadline2, v2, r2, s2, []);
            await challenge.connect(signers[2]).joinChallenge(deadline3, v3, r3, s3, []);
            await challenge.connect(signers[3]).joinChallenge(deadline4, v4, r4, s4, []);
            await challenge.connect(signers[4]).joinChallenge(deadline5, v5, r5, s5, []);

            await expect(
                challenge.connect(signers[5]).joinChallenge(deadline6, v6, r6, s6, [])
            ).to.be.revertedWith("This challenge is already full");

        })


        it('should not allow a participant to join twice', async function()  {
            const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);

            await challenge.joinChallenge(deadline1, v1, r1, s1, []);
            await expect(challenge.joinChallenge(deadline1, v1, r1, s1, [])).to.be.revertedWith("You already joined");
        })

        it('should allow a player to withdraw from the challenge (before start), while letting the challenge start when required without issues. Money should be sent back to him', async function() {
            //5 players join
            const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);
            const { v: v2, r: r2, s: s2, deadline: deadline2 } = await GetRSVsig(signers[1], token, bid, challenge);
            const { v: v3, r: r3, s: s3, deadline: deadline3 } = await GetRSVsig(signers[2], token, bid, challenge);
            const { v: v4, r: r4, s: s4, deadline: deadline4 } = await GetRSVsig(signers[3], token, bid, challenge);
            const { v: v5, r: r5, s: s5, deadline: deadline5 } = await GetRSVsig(signers[4], token, bid, challenge);

            await challenge.joinChallenge(deadline1, v1, r1, s1, []);
            await challenge.connect(signers[1]).joinChallenge(deadline2, v2, r2, s2, []);
            await challenge.connect(signers[2]).joinChallenge(deadline3, v3, r3, s3, []);
            await challenge.connect(signers[3]).joinChallenge(deadline4, v4, r4, s4, []);
            await challenge.connect(signers[4]).joinChallenge(deadline5, v5, r5, s5, []);

            //one player withdraws from challenge
            expect(
                await token.balanceOf(signers[2].address)
            ).to.equal(0);

            await challenge.connect(signers[2]).withdrawFromChallenge();

            //His balance should be 1000
            expect(
                await token.balanceOf(signers[2].address)
            ).to.equal(bid);

            //Admin successfully starts challenge
            await challenge.startChallenge();

            expect(
               await challenge.currentStatus()
            ).to.equal(ChallengeStatus.OngoingChallenge);
        })

        it('should not allow a player to withdraw from the challenge if he hasnt joined', async function() {
            //try to withdraw without having joined, reverts
            await expect(
               challenge.withdrawFromChallenge()
            ).to.be.revertedWith("You have not joined the challenge.");
        })

        it('should not allow a player to join, and then withdraw twice', async function() {
            const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);

            await challenge.joinChallenge(deadline1, v1, r1, s1, []);
            await challenge.withdrawFromChallenge();
            //try to withdraw without having joined, reverts
            await expect(
               challenge.withdrawFromChallenge()
            ).to.be.revertedWith("You have not joined the challenge.");
        })

        it('should allow a player to join, withdraw and then join again the challenge', async function() {
            //Needed twice, because of the nonce
            const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);
            

            await challenge.joinChallenge(deadline1, v1, r1, s1, []);
            await challenge.withdrawFromChallenge();

            const { v: v2, r: r2, s: s2, deadline: deadline2 } = await GetRSVsig(signers[0], token, bid, challenge);
            await expect(
               challenge.joinChallenge(deadline2, v2, r2, s2, [])
            ).to.not.be.reverted
        })

        it('should not allow to start the challenge if there is less than 2 players', async function() {
            const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);

            await challenge.joinChallenge(deadline1, v1, r1, s1, []);

            await expect(
                challenge.startChallenge()
            ).to.be.revertedWith("Not enough players to start the challenge")
        })


        it("should allow the admin to go to the next state", async function() {
            const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);
            const { v: v2, r: r2, s: s2, deadline: deadline2 } = await GetRSVsig(signers[1], token, bid, challenge);

            await challenge.joinChallenge(deadline1, v1, r1, s1, []);
            await challenge.connect(signers[1]).joinChallenge(deadline2, v2, r2, s2, []);
            await challenge.startChallenge();
            expect(
               await challenge.currentStatus()
            ).to.equal(ChallengeStatus.OngoingChallenge);
        })

    });

    describe("gathering players state (FOR GROUP MODE SPECIFIC TESTS)", function () {
        let challenge;
        let signers;
        let bid;
        let token;
        let merkleTree;

        //Function for using the group fixture with 'loadFixture'
        async function groupModeFixture() {
            return await deployedChallengeFixtureBase('group');
        }

        beforeEach(async function () {
            //Deploying in group mode
            ({challenge, signers, bid, token, merkleTree} = await loadFixture(groupModeFixture));
        });

        it('FOR GROUP MODE : should still allow players to join', async function() {
            const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);
            const { v: v2, r: r2, s: s2, deadline: deadline2 } = await GetRSVsig(signers[1], token, bid, challenge);
            const { v: v3, r: r3, s: s3, deadline: deadline3 } = await GetRSVsig(signers[2], token, bid, challenge);
            const { v: v4, r: r4, s: s4, deadline: deadline4 } = await GetRSVsig(signers[3], token, bid, challenge);

            //Get merkle proof for each player
            const proof1 = merkleTree.getProof([signers[0].address]);
            const proof2 = merkleTree.getProof([signers[1].address]);
            const proof3 = merkleTree.getProof([signers[2].address]);
            const proof4 = merkleTree.getProof([signers[3].address]);

            //join with proof
            await expect(
                challenge.connect(signers[0]).joinChallenge(deadline1, v1, r1, s1, proof1)
            ).to.not.be.reverted;
            await expect(
                challenge.connect(signers[1]).joinChallenge(deadline2, v2, r2, s2, proof2)
            ).to.not.be.reverted;
            await expect(
                challenge.connect(signers[2]).joinChallenge(deadline3, v3, r3, s3, proof3)
            ).to.not.be.reverted;
            await expect(
                challenge.connect(signers[3]).joinChallenge(deadline4, v4, r4, s4, proof4)
            ).to.not.be.reverted;
        })

        it('FOR GROUP MODE : should not allow a player to join if he is not among those chosen by the admin at creation', async function() {
            const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[5], token, bid, challenge);

            const proof1 = merkleTree.getProof([signers[0].address]);

            await expect(
                challenge.connect(signers[5]).joinChallenge(deadline1, v1, r1, s1, proof1)
            ).to.be.revertedWith("You are not allowed to join this challenge.")
        })
    })


    // state OngoingChallenge
    describe('ongoing challenge state', function() { 
        let challenge;
        let signers;
        beforeEach(async function () {
            ({challenge, signers} = await loadFixture(OngoingChallengeFixture));
        });

        it('state should be "OngoingChallenge" during the challenge. ', async function() {
            expect(await challenge.currentStatus()).to.equal(ChallengeStatus.OngoingChallenge);
        })
    });



    //state Voting for winner
    describe('voting for winner state', function() { 
        let challenge;
        let signers;
        beforeEach(async function () {
            ({challenge, signers} = await loadFixture(VotingForWinnerFixture));
        });

        it('should allow a player to vote (for another player).', async function(){
            await expect(
                challenge.voteForWinner(signers[1].address)
            ).to.not.be.reverted;
        })

        it('should not allow a non player to vote', async function(){
            await expect(
               challenge.connect(signers[5]).voteForWinner(signers[1].address)
            ).to.be.revertedWith("You are not a player. You cannot vote for winner.");
        })

        it('should not allow a player to vote twice', async function() {
            await challenge.voteForWinner(signers[1].address);
            await expect(
               challenge.voteForWinner(signers[1].address)
            ).to.be.revertedWith("You have already voted.");
        })

        it("should not allow to go to next state (ChallengeWon) if everyone has not voted (and minimum delay hasn't passed)", async function(){
            await challenge.voteForWinner(signers[1].address)
            await challenge.connect(signers[1]).voteForWinner(signers[1].address)
            await expect(
               challenge.endWinnerVote()
            ).to.be.revertedWith("Not all player have voted for a winner yet (and minimum delay has not passed)");
        })

        it("should allow ANYONE to go to next state (ChallengeWon) if everyone has not voted but minimum delay has passed", async function(){
            await challenge.voteForWinner(signers[1].address)
            await challenge.connect(signers[1]).voteForWinner(signers[1].address)

            //Pass enough time
            await time.increase(votingDelay);

            await expect(
               challenge.connect(signers[2]).endWinnerVote()
            ).not.to.be.reverted;
        })

        it('should allow ANYONE to go to next state (ChallengeWon) when everyone voted', async function(){
            await challenge.voteForWinner(signers[1].address)
            await challenge.connect(signers[1]).voteForWinner(signers[1].address) 
            await challenge.connect(signers[2]).voteForWinner(signers[2].address) 
            await challenge.connect(signers[3]).voteForWinner(signers[1].address) 
            await challenge.connect(signers[4]).voteForWinner(signers[2].address) 

            //Any player can end vote, because everyone has voted
            await challenge.connect(signers[1]).endWinnerVote();

            expect(await challenge.currentStatus()).to.equal(ChallengeStatus.ChallengeWon);
        })

        it('should not allow ANYONE to go to next state (ChallengeWon) if no one has voted (even if time has passed)', async function(){

            //Pass enough time
            await time.increase(votingDelay);

            //Any player can end vote, because everyone has voted
            await expect(challenge.connect(signers[1]).endWinnerVote()).to.be.revertedWith('Not allowed in this state');
        })

    });




    describe('challenge won state', function() { 
        let challenge;
        let signers;
        let bid;
        let token;
        beforeEach(async function () {
            ({challenge, signers, bid, token} = await loadFixture(VotingForWinnerFixture));
        });
        

        it('winner should be able to retrieve prize when endWinnerVote() is triggered', async function(){
            //Players voting
            await challenge.voteForWinner(signers[1].address)
            await challenge.connect(signers[1]).voteForWinner(signers[2].address) 
            await challenge.connect(signers[2]).voteForWinner(signers[2].address) 
            await challenge.connect(signers[3]).voteForWinner(signers[1].address) 
            await challenge.connect(signers[4]).voteForWinner(signers[2].address) 

            //Check balance before
            const balanceBefore = await token.balanceOf(signers[2].address);
            //End vote
            await challenge.endWinnerVote();

            await challenge.connect(signers[2]).withdrawPrize();

            //Check balance after
            const balanceAfter = await token.balanceOf(signers[2].address);

            const diff = balanceAfter - balanceBefore;
            const expectedDiff = bid*5n - 5n*bid*bronze/100n;

            //Difference should be equal to cash prize won
            expect(diff).to.equal(expectedDiff); // substract fees too
        })

        it('winner should NOT be able to retrieve prize multiple times', async function(){
            //Players voting
            await challenge.voteForWinner(signers[1].address)
            await challenge.connect(signers[1]).voteForWinner(signers[2].address) 
            await challenge.connect(signers[2]).voteForWinner(signers[2].address) 
            await challenge.connect(signers[3]).voteForWinner(signers[1].address) 
            await challenge.connect(signers[4]).voteForWinner(signers[2].address) 

            //End vote
            await challenge.endWinnerVote();

            await challenge.connect(signers[2]).withdrawPrize();

            await expect(
                challenge.connect(signers[2]).withdrawPrize()
            ).to.be.revertedWith("You have already withdrawn your prize");
            
        })

        it("When there is a tie, should allow both winners to receive prize", async function () {
            //Players voting
            await challenge.voteForWinner(signers[2].address)
            await challenge.connect(signers[1]).voteForWinner(signers[1].address)
            await challenge.connect(signers[2]).voteForWinner(signers[2].address)
            await challenge.connect(signers[3]).voteForWinner(signers[1].address)
            await challenge.connect(signers[4]).voteForWinner(signers[4].address)

            //Check balance before for both winners
            const balanceBefore1 = await token.balanceOf(signers[1].address);
            const balanceBefore2 = await token.balanceOf(signers[2].address);

            //End vote
            await challenge.endWinnerVote();

            await challenge.connect(signers[1]).withdrawPrize();
            //Check balance after (winner1)
            const balanceAfter1 = await token.balanceOf(signers[1].address);

            const diff1 = balanceAfter1 - balanceBefore1;
            const expectedDiff1 = bid*5n/2n - bid*5n/2n*gold/100n;

            expect(
                diff1
            ).to.equal(expectedDiff1);

            await challenge.connect(signers[2]).withdrawPrize();
            //Check balance after (winner2)
            const balanceAfter2 = await token.balanceOf(signers[2].address);

            const diff2 = balanceAfter2 - balanceBefore2;

            const expectedDiff2 = bid*5n/2n - bid*5n/2n*bronze/100n;

            expect(
                diff2
            ).to.equal(expectedDiff2); //substract fees too
        });

        it('if more tokens (signers[1] gold tier here), winner should receive more tokens', async function(){
            //Players voting
            await challenge.voteForWinner(signers[1].address)
            await challenge.connect(signers[1]).voteForWinner(signers[1].address) 
            await challenge.connect(signers[2]).voteForWinner(signers[1].address) 
            await challenge.connect(signers[3]).voteForWinner(signers[0].address) 
            await challenge.connect(signers[4]).voteForWinner(signers[2].address) 

            //Check balance before
            const balanceBefore = await token.balanceOf(signers[1].address);
            //End vote
            await challenge.endWinnerVote();

            await challenge.connect(signers[1]).withdrawPrize();
            //Check balance after
            const balanceAfter = await token.balanceOf(signers[1].address);

            const diff = balanceAfter - balanceBefore;
            const expectedDiff = bid*5n - 5n*bid*gold/100n;

            //Difference should be equal to cash prize won
            expect(diff).to.equal(expectedDiff); // substract fees too
        })

        it("fee receiver should receive half of the fees (the rest is burnt)", async function () {
            //Players voting
            await challenge.voteForWinner(signers[2].address)
            await challenge.connect(signers[1]).voteForWinner(signers[2].address)
            await challenge.connect(signers[2]).voteForWinner(signers[2].address)
            await challenge.connect(signers[3]).voteForWinner(signers[1].address)
            await challenge.connect(signers[4]).voteForWinner(signers[4].address)

            const balanceBefore = await token.balanceOf(signers[0].address);
            //End vote
            await challenge.endWinnerVote();

            await challenge.connect(signers[2]).withdrawPrize();
            const balanceAfter = await token.balanceOf(signers[0].address);

            const diff = balanceAfter - balanceBefore;
            const expectedFeesReceived = 5n*bid/2n*bronze/100n;
            
            expect(
                diff
            ).to.equal(expectedFeesReceived);
        });

        it("half of the fees should have been burnt", async function () {
            //Players voting
            await challenge.voteForWinner(signers[0].address)
            await challenge.connect(signers[1]).voteForWinner(signers[0].address)
            await challenge.connect(signers[2]).voteForWinner(signers[2].address)
            await challenge.connect(signers[3]).voteForWinner(signers[1].address)
            await challenge.connect(signers[4]).voteForWinner(signers[4].address)

            const initialTotalSupply = await token.totalSupply();
            //End vote
            await challenge.endWinnerVote();

            await challenge.connect(signers[0]).withdrawPrize();
            const finalTotalSupply = await token.totalSupply();

            const diff = initialTotalSupply - finalTotalSupply;
            const expectedBurntAmount = bid*5n/2n*platinum/100n;
            
            expect(
                diff
            ).to.equal(expectedBurntAmount);
        });
    })




    //Check only owner functions
    describe('Owner functions', function() {
        it('should not allow not admin player to go to OngoingChallenge state', async function() {
            const {challenge, signers} = await loadFixture(deployedChallengeFixtureBase);

            await expect(
               challenge.connect(signers[1]).startChallenge()
            ).to.be.revertedWithCustomError(challenge, "OwnableUnauthorizedAccount").withArgs(signers[1].address);
        })
    })


    //Checking function availability considering current state. For each state, check that only the authorized functions are available
    describe('State functions availability', function() { 
        
        describe('state GatheringPlayers', function(){ 
            let challenge;
            let signers;
            beforeEach(async function () {
                ({challenge, signers} = await loadFixture(deployedChallengeFixtureBase));
            });

            it('should not allow voteForWinner() in GatheringPlayers state', async function() {
                await expect(
                    challenge.voteForWinner(signers[1].address)
                ).to.be.revertedWith("Not allowed in this state");
            }) 
            it('should not allow endWinnerVote() in GatheringPlayers state', async function() {
                await expect(
                    challenge.endWinnerVote()
                ).to.be.revertedWith("Not allowed in this state");
            }) 
            it('should not allow withdrawPrize() in GatheringPlayers state', async function() {
                await expect(
                    challenge.withdrawPrize()
                ).to.be.revertedWith("Not allowed in this state");
            })
        })


        describe('state OngoingChallenge', function(){ 
            let challenge;
            let signers;
            let bid;
            let token;
            beforeEach(async function () {
                ({challenge, signers, bid, token} = await loadFixture(OngoingChallengeFixture));  
            });

            it('should not allow joinChallenge() in OngoingChallenge state', async function() {
                const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);
                await expect(
                    challenge.joinChallenge(deadline1, v1, r1, s1, [])
                ).to.be.revertedWith("Not allowed in this state");
            }) 
            it('should not allow withdrawFromChallenge() in OngoingChallenge state', async function() {
                await expect(
                    challenge.withdrawFromChallenge()
                ).to.be.revertedWith("Not allowed in this state");
            }) 
            it('should not allow startChallenge() in OngoingChallenge state', async function() {
                await expect(
                    challenge.startChallenge()
                ).to.be.revertedWith("Not allowed in this state");
            }) 
            it('should not allow voteForWinner() in OngoingChallenge state (if the challenge is not over)', async function() {
                await expect(
                    challenge.voteForWinner(signers[1].address)
                ).to.be.revertedWith("You are not allowed to vote now");
            }) 
            it('should allow voteForWinner() in OngoingChallenge state (if the challenge is over). state should become "VotingForWinner" after first player votes at the end of the challenge. ', async function() {
                expect(await challenge.currentStatus()).to.equal(ChallengeStatus.OngoingChallenge);

                //wait for challenge to end
                await time.increase(duration);
                
                //should be allowed
                await expect(
                    challenge.voteForWinner(signers[1].address)
                ).to.not.be.reverted;
                //State should have changed
                expect(await challenge.currentStatus()).to.equal(ChallengeStatus.VotingForWinner);
            })
            it('should not allow endWinnerVote() in OngoingChallenge state', async function() {
                await expect(
                    challenge.endWinnerVote()
                ).to.be.revertedWith("Not allowed in this state");
            })
            it('should not allow withdrawPrize() in OnGoingChallenge state', async function() {
                await expect(
                    challenge.withdrawPrize()
                ).to.be.revertedWith("Not allowed in this state");
            })
        })


        describe('state VotingForWinner', function(){ 
            let challenge;
            let signers;
            let bid;
            let token;
            beforeEach(async function () {
                ({challenge, signers, bid, token} = await loadFixture(VotingForWinnerFixture));
            });

            it('should not allow joinChallenge() in VotingForWinner state', async function() {
                const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);
                await expect(
                    challenge.joinChallenge(deadline1, v1, r1, s1, [])
                ).to.be.revertedWith("Not allowed in this state");
            }) 
            it('should not allow withdrawFromChallenge() in OngoingChallenge state', async function() {
                await expect(
                    challenge.withdrawFromChallenge()
                ).to.be.revertedWith("Not allowed in this state");
            }) 
            it('should not allow startChallenge() in VotingForWinner state', async function() {
                await expect(
                    challenge.startChallenge()
                ).to.be.revertedWith("Not allowed in this state");
            }) 
            it('should not allow withdrawPrize() in VotingForWinner state', async function() {
                await expect(
                    challenge.withdrawPrize()
                ).to.be.revertedWith("Not allowed in this state");
            })
        })

        
        describe('state ChallengeWon', function(){ 
            let challenge;
            let signers;
            let bid;
            let token;
            beforeEach(async function () {
                ({challenge, signers, bid, token} = await loadFixture(EndingVoteFixture));
                await challenge.endWinnerVote();
            });

            it('should not allow joinChallenge() in ChallengeWon state', async function() {
                const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);
                await expect(
                    challenge.joinChallenge(deadline1, v1, r1, s1, [])
                ).to.be.revertedWith("Not allowed in this state");
            }) 
            it('should not allow withdrawFromChallenge() in OngoingChallenge state', async function() {
                await expect(
                    challenge.withdrawFromChallenge()
                ).to.be.revertedWith("Not allowed in this state");
            }) 
            it('should not allow startChallenge() in ChallengeWon state', async function() {
                await expect(
                    challenge.startChallenge()
                ).to.be.revertedWith("Not allowed in this state");
            })  
            it('should not allow voteForWinner() in ChallengeWon state', async function() {
                await expect(
                    challenge.voteForWinner(signers[1].address)
                ).to.be.revertedWith("Not allowed in this state");
            }) 
            it('should not allow endWinnerVote() in ChallengeWon state', async function() {
                await expect(
                    challenge.endWinnerVote()
                ).to.be.revertedWith("Not allowed in this state");
            }) 
        })
        
    })


    //Events
    describe('Events', function() { 

        it("should emit an event when a Player Joined", async function() {
            const {challenge, signers, bid, token} = await loadFixture(deployedChallengeFixtureBase)
            const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);

            await expect(challenge.joinChallenge(deadline1, v1, r1, s1, []))
                .to.emit(challenge, "PlayerJoined")
                .withArgs(signers[0].address); 
        })

        it("should emit an event when a Player Withdraws from challenge", async function() {
            const {challenge, signers, bid, token} = await loadFixture(deployedChallengeFixtureBase)
            const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);

            await challenge.joinChallenge(deadline1, v1, r1, s1, []);
            await expect(challenge.withdrawFromChallenge())
                .to.emit(challenge, "PlayerWithdrawn")
                .withArgs(signers[0].address); 
        })

        it("should emit an event when ChallengeStarted", async function() {
            const {challenge, signers, bid, token} = await loadFixture(deployedChallengeFixtureBase)
            const { v: v1, r: r1, s: s1, deadline: deadline1 } = await GetRSVsig(signers[0], token, bid, challenge);
            const { v: v2, r: r2, s: s2, deadline: deadline2 } = await GetRSVsig(signers[1], token, bid, challenge);

            await challenge.joinChallenge(deadline1, v1, r1, s1, []);
            await challenge.connect(signers[1]).joinChallenge(deadline2, v2, r2, s2, []);

            await expect(challenge.startChallenge())
                .to.emit(challenge, "ChallengeStarted")
        })

        it("should emit an event when ChallengeEnded ", async function() {
            const {challenge, signers} = await loadFixture(OngoingChallengeFixture)

            //Pass enough time
            await time.increase(duration)

            await expect(challenge.voteForWinner(signers[1].address))
                .to.emit(challenge, "ChallengeEnded")
        })

        it("should emit an event when PlayerVoted", async function() {
            const {challenge, signers} = await loadFixture(VotingForWinnerFixture)
            await expect(challenge.voteForWinner(signers[1].address))
                .to.emit(challenge, "PlayerVoted")
                .withArgs(signers[0].address, signers[1].address)
        })

        it("should emit an event when a prize is sent", async function() {
            const {challenge, signers, bid} = await loadFixture(EndingVoteFixture)

            await challenge.endWinnerVote()

            const expectedPrize = bid*5n - 5n*bid*BigInt(gold)/100n;

            await expect(
                await challenge.connect(signers[1]).withdrawPrize()
            ).to.emit(challenge, "PrizeWithdrawn")
                .withArgs(signers[1].address, expectedPrize)
        })
    })
    
})