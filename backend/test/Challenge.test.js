const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { assert, expect } = require("chai")
const { ethers } = require("hardhat")
// const helpers = require("@nomicfoundation/hardhat-network-helpers")

const { durationSlot, maxPlayersSlot, bidSlot } = require("./utils/constants");

describe("tests Challenge contract", function () {

/**************  Starting fixtures ****************/ 

    //Important Global variables
    const votingDelay = 10000;
    const duration = 1000n;
    const maxPlayers = 5n;
    const description = "test";

    let totalFee;
    //Fee tier (used to divide)
    const bronze = 0.05; //5 % (<10000 tokens)
    const silver = 0.04; //4 % (>10000 and <40000 tokens)
    const gold = 0.03; //3 % (>40000 and <100000 tokens)
    const platinum = 0.02; //2 % (>100000 tokens)




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
        await token.transfer(signers[1].address, ethers.parseUnits("20000", await token.decimals()));

        totalFee = (3*bronze + silver + platinum)/5;

        const bid = ethers.parseUnits("1000", await token.decimals());

        //Challenge Deployment
        const Challenge = await ethers.getContractFactory('Challenge'); 

        let challenge;
        if(mode == "link"){
            challenge = await Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, false, []);
        }else if(mode == "group"){
            //array of players to store
            const players = [signers[0].address, signers[1].address, signers[2].address, signers[3].address, signers[4].address]
            challenge = await Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, true, players);
        }
        

        //Players approve the right for the contract to use their tokens
        await token.approve(challenge.target, bid);
        await token.connect(signers[1]).approve(challenge.target, bid);
        await token.connect(signers[2]).approve(challenge.target, bid);
        await token.connect(signers[3]).approve(challenge.target, bid);
        await token.connect(signers[4]).approve(challenge.target, bid);

        return { challenge, signers, token, bid };
    }

    //Ongoing challenge (LINK MODE)
    async function OngoingChallengeFixture() {
        //Use the previous function (to not write duplicate code)
        const { challenge, signers, token, bid } = await deployedChallengeFixtureBase();

        //5 players join
        await challenge.joinChallenge();
        await challenge.connect(signers[1]).joinChallenge();
        await challenge.connect(signers[2]).joinChallenge();
        await challenge.connect(signers[3]).joinChallenge();
        await challenge.connect(signers[4]).joinChallenge();

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
    //   WaitingForChallenge: 1,
      OngoingChallenge: 1,
    //   WaitingForVote: 3,
      VotingForWinner: 2,
      ChallengeWon: 3,
    };



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
                Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, false, [])
            ).to.not.be.reverted
        })

        it('should not be possible to deploy with a feeReceiver address to 0', async function() { 
            //Challenge Deployment
            const Challenge = await ethers.getContractFactory('Challenge'); 

            await expect(
                Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, "0x0000000000000000000000000000000000000000", false, [])
            ).to.be.revertedWith("the feeReceiver cannot be address 0!")
        })

        it('GROUP MODE : should not be possible to deploy if one player in the array is address 0', async function() { 
            //Challenge Deployment
            const Challenge = await ethers.getContractFactory('Challenge'); 

            const playersArray = [signers[0].address, signers[1].address, "0x0000000000000000000000000000000000000000"]
            await expect(
                Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, true, playersArray)
            ).to.be.revertedWith("address 0 cannot be a player!")
        })

    })

    //state gathering players
    describe('gathering players state', function() { 
        let challenge;
        let signers;
        let bid;
        let token;
        beforeEach(async function () {
            ({challenge, signers, bid, token} = await loadFixture(deployedChallengeFixtureBase));
        });

        it('should store a player in the players array (sending enough money)', async function() {
 
            await expect(challenge.joinChallenge())
            .to.not.be.reverted;
            await expect(challenge.connect(signers[1]).joinChallenge())
            .to.not.be.reverted;

            const player1 = await challenge.players(0);
            expect(player1[0]).to.equal(signers[0].address);

            const player2 = await challenge.players(1);
            expect(player2[0]).to.equal(signers[1].address);
        })

        it('FOR LINK MODE : should not allow any more participants to join if the max is already reached', async function() {
            await challenge.joinChallenge();
            await challenge.connect(signers[1]).joinChallenge();
            await challenge.connect(signers[2]).joinChallenge();
            await challenge.connect(signers[3]).joinChallenge();
            await challenge.connect(signers[4]).joinChallenge();

            const player1 = await challenge.players(0);
            expect(player1[0]).to.equal(signers[0].address);

            const player2 = await challenge.players(1);
            expect(player2[0]).to.equal(signers[1].address);

            const player3 = await challenge.players(2);
            expect(player3[0]).to.equal(signers[2].address);

            const player4 = await challenge.players(3);
            expect(player4[0]).to.equal(signers[3].address);

            const player5 = await challenge.players(4);
            expect(player5[0]).to.equal(signers[4].address);

            await expect(challenge.connect(signers[5]).joinChallenge()).to.be.revertedWith("This challenge is already full");

        })


        it('should not allow a participant to join twice', async function()  {
            await challenge.joinChallenge();
            await expect(challenge.joinChallenge()).to.be.revertedWith("You already joined");
        })

        it('should not allow a player to join if he did not approve enough tokens', async function() {
            //signer 5 approves not enough tokens
            await token.connect(signers[5]).approve(challenge.target, bid-1n);

            await expect(
                challenge.connect(signers[5]).joinChallenge()
            ).to.be.revertedWith("Need prior approval for token spending");
        })

        it('should allow a player to withdraw from the challenge (before start), while letting the challenge start when required without issues', async function() {
            //5 players join
            await challenge.joinChallenge();
            await challenge.connect(signers[1]).joinChallenge();
            await challenge.connect(signers[2]).joinChallenge();
            await challenge.connect(signers[3]).joinChallenge();
            await challenge.connect(signers[4]).joinChallenge();

            //one player withdraws from challenge
            await challenge.connect(signers[2]).withdrawFromChallenge();

            const player1 = await challenge.players(0);
            expect(player1[0]).to.equal(signers[0].address);

            const player2 = await challenge.players(1);
            expect(player2[0]).to.equal(signers[1].address);

            const player3 = await challenge.players(2);
            expect(player3[0]).to.equal(signers[4].address);

            const player4 = await challenge.players(3);
            expect(player4[0]).to.equal(signers[3].address);

            //the 3rd player should not be in the array anymore, this should revert
            await expect(
                challenge.players(4)
            ).to.be.reverted;

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
            ).to.be.revertedWith("You are not in players list");
        })

        it('should allow a player to join, withdraw and then join again the challenge', async function() {
            await challenge.joinChallenge();
            await challenge.withdrawFromChallenge();
            await expect(
               challenge.joinChallenge()
            ).to.not.be.reverted
        })

        it('should not allow to start the challenge if there is less than 2 players', async function() {
            challenge.joinChallenge();
            await expect(
                challenge.startChallenge()
            ).to.be.revertedWith("Not enough players to start the challenge")
        })


        it("should revert startChallenge() if a participant doesnt have enough tokens", async function() {
            await challenge.joinChallenge()
            //signer 0 sends tokens to signer 6, but not enough
            await token.transfer(signers[6], bid-1n);
            await token.connect(signers[6]).approve(challenge.target, bid);
            await challenge.connect(signers[6]).joinChallenge()

            await expect(
                challenge.startChallenge()
            ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
        })
        it("should revert startChallenge() if a participant did not approve enough tokens", async function() {
            await challenge.joinChallenge()
            //signer 0 sends tokens to signer 6, but not enough
            await token.transfer(signers[6], bid);
            await token.connect(signers[6]).approve(challenge.target, bid);
            await challenge.connect(signers[6]).joinChallenge()
            //lowers approval amount
            await token.connect(signers[6]).approve(challenge.target, bid-1n);

            await expect(
                challenge.startChallenge()
            ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
        })

        it("should allow the admin to go to the next state", async function() {
            await challenge.joinChallenge();
            await challenge.connect(signers[1]).joinChallenge();
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
        
        //Function for using the group fixture with 'loadFixture'
        async function groupModeFixture() {
            return await deployedChallengeFixtureBase('group');
        }

        beforeEach(async function () {
            //Deploying in group mode
            ({challenge, signers, bid, token} = await loadFixture(groupModeFixture));
        });

        it('FOR GROUP MODE : the stored array of players should be correct', async function() {
            await challenge.connect(signers[0]).joinChallenge()
            await challenge.connect(signers[1]).joinChallenge()
            await challenge.connect(signers[2]).joinChallenge()
            await challenge.connect(signers[3]).joinChallenge()
            
            const player1 = await challenge.players(0);
            expect(player1[0]).to.equal(signers[0].address);

            const player2 = await challenge.players(1);
            expect(player2[0]).to.equal(signers[1].address);

            const player3 = await challenge.players(2);
            expect(player3[0]).to.equal(signers[2].address);

            const player4 = await challenge.players(3);
            expect(player4[0]).to.equal(signers[3].address);

        })

        it('FOR GROUP MODE : should not allow a player to join if he is not among those chosen by the admin at creation', async function() {
            await expect(
                challenge.connect(signers[5]).joinChallenge()
            ).to.be.revertedWith("You are not allowed to join this challenge.")
        })
    })



    
    //state OngoingChallenge
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

        it('should allow a player to vote (for another player). check that the vote is registered', async function(){
            await challenge.voteForWinner(signers[1].address);

            const player2 = await challenge.players(1);
            expect(player2[1]).to.equal(1);
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

    ///Automated Vote Ending (chainlink automation)
    // describe("Automated vote ending with chainlink", function() {
    //     let challenge;
    //     let signers;
    //     let bid;
    //     let token;
    //     beforeEach(async function () {
    //         ({challenge, signers, bid, token} = await loadFixture(VotingForWinnerFixture));
    //     });

    //     it("should end the vote 'Automatically', after everyone has voted", async function() {

    //         await challenge.voteForWinner(signers[1].address)
    //         await challenge.connect(signers[1]).voteForWinner(signers[1].address) 
    //         await challenge.connect(signers[2]).voteForWinner(signers[2].address) 
    //         await challenge.connect(signers[3]).voteForWinner(signers[1].address) 
    //         await challenge.connect(signers[4]).voteForWinner(signers[2].address)

    //         // Vérifier que checkUpkeep renvoie true
    //         const [upkeepNeeded] = await challenge.checkUpkeep("0x");
    //         expect(upkeepNeeded).to.be.true;
    //         // Simuler l'appel performUpkeep (manuellement ou via impersonation)
    //         await challenge.performUpkeep("0x");
    //         // Vérifier que le statut a changé
    //         expect(await challenge.currentStatus()).to.equal(ChallengeStatus.ChallengeWon);
    //     })

    //     it("should end the vote 'Automatically', after voting time has passed", async function() {

    //         await challenge.voteForWinner(signers[1].address)
    //         await challenge.connect(signers[1]).voteForWinner(signers[1].address) 
    //         await challenge.connect(signers[2]).voteForWinner(signers[2].address) 
    //         await challenge.connect(signers[3]).voteForWinner(signers[1].address) 

    //         //Pass enough time
    //         await time.increase(votingDelay);

    //         // Vérifier que checkUpkeep renvoie true
    //         const [upkeepNeeded] = await challenge.checkUpkeep("0x");
    //         expect(upkeepNeeded).to.be.true;
    //         // Simuler l'appel performUpkeep (manuellement ou via impersonation)
    //         await challenge.performUpkeep("0x");
    //         // Vérifier que le statut a changé
    //         expect(await challenge.currentStatus()).to.equal(ChallengeStatus.ChallengeWon);
    //     })
        
    // })



//Ending vote
    describe('challenge won state', function() { 
        let challenge;
        let signers;
        let bid;
        let token;
        beforeEach(async function () {
            ({challenge, signers, bid, token} = await loadFixture(VotingForWinnerFixture));
        });
        

        it('winner should receive prize when endWinnerVote() is triggered', async function(){
            //Players voting
            await challenge.voteForWinner(signers[1].address)
            await challenge.connect(signers[1]).voteForWinner(signers[1].address) 
            await challenge.connect(signers[2]).voteForWinner(signers[2].address) 
            await challenge.connect(signers[3]).voteForWinner(signers[1].address) 
            await challenge.connect(signers[4]).voteForWinner(signers[2].address) 

            //Check balance before
            const balanceBefore = await token.balanceOf(signers[1].address);
            //End vote
            await challenge.endWinnerVote();

            //Check balance after
            const balanceAfter = await token.balanceOf(signers[1].address);

            const diff = Number(balanceAfter - balanceBefore);
            const numberBid = Number(bid);
            const expectedDiff = numberBid*5 - 5*numberBid*totalFee;

            //Difference should be equal to cash prize won
            expect(diff).to.equal(expectedDiff); // substract fees too
        })

        it("fee receiver should receive half of the fees (the rest is burnt)", async function () {
            //Players voting
            await challenge.voteForWinner(signers[2].address)
            await challenge.connect(signers[1]).voteForWinner(signers[1].address)
            await challenge.connect(signers[2]).voteForWinner(signers[2].address)
            await challenge.connect(signers[3]).voteForWinner(signers[1].address)
            await challenge.connect(signers[4]).voteForWinner(signers[4].address)

            const balanceBefore = await token.balanceOf(signers[0].address);
            //End vote
            await challenge.endWinnerVote();

            const balanceAfter = await token.balanceOf(signers[0].address);

            const diff = Number(balanceAfter - balanceBefore);
            const numberBid = Number(bid);
            const expectedFeesReceived = numberBid*5*totalFee/2;
            
            expect(
                diff
            ).to.equal(expectedFeesReceived);
        });

        it("half of the fees should have been burnt", async function () {
            //Players voting
            await challenge.voteForWinner(signers[2].address)
            await challenge.connect(signers[1]).voteForWinner(signers[1].address)
            await challenge.connect(signers[2]).voteForWinner(signers[2].address)
            await challenge.connect(signers[3]).voteForWinner(signers[1].address)
            await challenge.connect(signers[4]).voteForWinner(signers[4].address)

            const initialTotalSupply = await token.totalSupply();
            //End vote
            await challenge.endWinnerVote();

            const finalTotalSupply = await token.totalSupply();

            const diff = Number(initialTotalSupply - finalTotalSupply);
            const numberBid = Number(bid);
            const expectedBurntAmount = numberBid*5*totalFee/2;
            
            expect(
                diff
            ).to.equal(expectedBurntAmount);
        });

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

            const winner1 = await challenge.challengeWinners(0)
            const winner2 = await challenge.challengeWinners(1)

            expect(winner1).to.equal(signers[2].address);
            expect(winner2).to.equal(signers[1].address);

            //Check balance after (winner1)
            const balanceAfter1 = await token.balanceOf(signers[1].address);

            const diff1 = Number(balanceAfter1 - balanceBefore1);
            const numberBid = Number(bid);
            const expectedDiff = numberBid*5/2 - 5*numberBid*totalFee/2;

            expect(
                diff1
            ).to.equal(expectedDiff);

            //Check balance after (winner2)
            const balanceAfter2 = await token.balanceOf(signers[2].address);

            const diff2 = Number(balanceAfter2 - balanceBefore2);

            expect(
                diff2
            ).to.equal(expectedDiff); //substract fees too
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
        })


        describe('state OngoingChallenge', function(){ 
            let challenge;
            let signers;
            let bid;
            beforeEach(async function () {
                ({challenge, signers} = await loadFixture(OngoingChallengeFixture));
            });

            it('should not allow joinChallenge() in OngoingChallenge state', async function() {
                await expect(
                    challenge.joinChallenge()
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
        })


        describe('state VotingForWinner', function(){ 
            let challenge;
            let signers;
            let bid;
            beforeEach(async function () {
                ({challenge, signers, bid} = await loadFixture(VotingForWinnerFixture));
            });

            it('should not allow joinChallenge() in VotingForWinner state', async function() {
                await expect(
                    challenge.joinChallenge()
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
        })

        
        describe('state ChallengeWon', function(){ 
            let challenge;
            let signers;
            let bid;
            beforeEach(async function () {
                ({challenge, signers, bid} = await loadFixture(EndingVoteFixture));
                await challenge.endWinnerVote();
            });

            it('should not allow joinChallenge() in ChallengeWon state', async function() {
                await expect(
                    challenge.joinChallenge()
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
            const {challenge, signers, bid} = await loadFixture(deployedChallengeFixtureBase)
            await expect(challenge.joinChallenge())
                .to.emit(challenge, "PlayerJoined")
                .withArgs(signers[0].address); 
        })

        it("should emit an event when a Player Withdraws from challenge", async function() {
            const {challenge, signers, bid} = await loadFixture(deployedChallengeFixtureBase)
            await challenge.joinChallenge();
            await expect(challenge.withdrawFromChallenge())
                .to.emit(challenge, "PlayerWithdrawn")
                .withArgs(signers[0].address); 
        })

        it("should emit an event when ChallengeStarted", async function() {
            const {challenge, signers} = await loadFixture(deployedChallengeFixtureBase)

            await challenge.joinChallenge();
            await challenge.connect(signers[1]).joinChallenge();

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

        // it("should emit an event when VoteEnded", async function() {
        //     const {challenge, signers} = await loadFixture(VotingForWinnerFixture)

        //     await challenge.voteForWinner(signers[1].address)
        //     await challenge.connect(signers[1]).voteForWinner(signers[1].address) 
        //     await challenge.connect(signers[2]).voteForWinner(signers[2].address) 
        //     await challenge.connect(signers[3]).voteForWinner(signers[2].address) 
        //     await challenge.connect(signers[4]).voteForWinner(signers[4].address)

        //     const winnersArray = [signers[1].address, signers[2].address];

        //     await expect(challenge.endWinnerVote())
        //         .to.emit(challenge, "VoteEnded")
        //         .withArgs(winnersArray)
        // })

        it("should emit an event when a prize is sent", async function() {
            const {challenge, signers, bid} = await loadFixture(EndingVoteFixture)
            
            const expectedPrize = bid*5n - 5n*bid*BigInt(totalFee*1000)/1000n;

            await expect(await challenge.endWinnerVote())
                .to.emit(challenge, "PrizeSent")
                .withArgs(signers[1].address, expectedPrize)
        })
    })
})