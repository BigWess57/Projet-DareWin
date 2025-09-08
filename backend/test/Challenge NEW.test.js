const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai")
const { ethers } = require("hardhat")

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


    function getTimestampInSeconds() {
        // returns current timestamp in seconds
        return Math.floor(Date.now() / 1000);
    }


    //Just deployment (base state)
    
    async function deployedChallengeFixtureBase(mode = "link") {
        const signers = await ethers.getSigners();

        //Token deployment + Funding players (for setup)^
        const DareWinToken = await ethers.getContractFactory('DareWinNew');
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
        const Challenge = await ethers.getContractFactory('ChallengeNew'); 

        let challenge;
        if(mode == "link"){
            challenge = await Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, false, []);
        }else if(mode == "group"){
            //array of players to store
            const players = [signers[0].address, signers[1].address, signers[2].address, signers[3].address, signers[4].address]
            
            challenge = await Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, true, players);
        }

        //Players approve the right for the contract to use their tokens
        // await token.approve(challenge.target, bid);
        // await token.connect(signers[1]).approve(challenge.target, bid);
        // await token.connect(signers[2]).approve(challenge.target, bid);
        // await token.connect(signers[3]).approve(challenge.target, bid);
        // await token.connect(signers[4]).approve(challenge.target, bid);

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




    //Helper function for permit
    async function GetRSVsig(signer, token, bid, challenge) {
        //For permit
        // set token deadline
        const deadline = getTimestampInSeconds() + 300;
    
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
        console.log(signature)

        // split the signature into its components
        const sig = ethers.Signature.from(signature)
        console.log(sig)

        const v = sig.v ?? (27 + sig.yParity); // 27/28

        // // verify the Permit type data with the signature
        const recovered = ethers.verifyTypedData(
            domain,
            types,
            values,
            sig
        );
        console.log("expected owner:", signer.address);
        console.log("recovered address:", recovered);

        return {sig, deadline};
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
            const DareWinToken = await ethers.getContractFactory('DareWinNew');
            token = await DareWinToken.deploy(signers[0].address);

            bid = ethers.parseUnits("1000", await token.decimals());
        });

        it('should juste deploy the contract', async function() { 
            
            //Challenge Deployment
            const Challenge = await ethers.getContractFactory('ChallengeNew'); 

            await expect(
                Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, false, [])
            ).to.not.be.reverted
        })

        it('should not be possible to deploy with a feeReceiver address to 0', async function() { 
            //Challenge Deployment
            const Challenge = await ethers.getContractFactory('ChallengeNew'); 

            await expect(
                Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, "0x0000000000000000000000000000000000000000", false, [])
            ).to.be.revertedWith("the feeReceiver cannot be address 0!")
        })

        it('GROUP MODE : should not be possible to deploy if one player in the array is address 0', async function() { 
            //Challenge Deployment
            const Challenge = await ethers.getContractFactory('ChallengeNew'); 

            const playersArray = [signers[0].address, signers[1].address, "0x0000000000000000000000000000000000000000"]
            await expect(
                Challenge.deploy(signers[0].address, token.target, duration, maxPlayers, bid, description, signers[0].address, true, playersArray)
            ).to.be.revertedWith("address 0 cannot be a player!")
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

        it('should send the money to the challenge contract correctly', async function() {
            const {sig, deadline} = await GetRSVsig(signers[0], token, bid, challenge);
            const v = sig.v ?? (27 + sig.yParity);
console.log(sig)
console.log(deadline)
console.log(v)
            expect(
                await token.balanceOf(challenge)
            ).to.equal(0)

            await expect(challenge.joinChallenge(signers[0].address, challenge.target, bid, deadline, v, sig.r, sig.s))
            .to.not.be.reverted;
            
            expect(
                await token.balanceOf(challenge)
            ).to.equal(bid)
        })

        // it('should store a player in the players array (if sending enough money)', async function() {
 
        //     await expect(challenge.joinChallenge())
        //     .to.not.be.reverted;
        //     await expect(challenge.connect(signers[1]).joinChallenge())
        //     .to.not.be.reverted;

        //     const player1 = await challenge.players(0);
        //     expect(player1[0]).to.equal(signers[0].address);

        //     const player2 = await challenge.players(1);
        //     expect(player2[0]).to.equal(signers[1].address);
        // })        

        // it('FOR LINK MODE : should not allow any more participants to join if the max is already reached', async function() {
        //     await challenge.joinChallenge();
        //     await challenge.connect(signers[1]).joinChallenge();
        //     await challenge.connect(signers[2]).joinChallenge();
        //     await challenge.connect(signers[3]).joinChallenge();
        //     await challenge.connect(signers[4]).joinChallenge();

        //     const player1 = await challenge.players(0);
        //     expect(player1[0]).to.equal(signers[0].address);

        //     const player2 = await challenge.players(1);
        //     expect(player2[0]).to.equal(signers[1].address);

        //     const player3 = await challenge.players(2);
        //     expect(player3[0]).to.equal(signers[2].address);

        //     const player4 = await challenge.players(3);
        //     expect(player4[0]).to.equal(signers[3].address);

        //     const player5 = await challenge.players(4);
        //     expect(player5[0]).to.equal(signers[4].address);

        //     await expect(challenge.connect(signers[5]).joinChallenge()).to.be.revertedWith("This challenge is already full");

        // })


        // it('should not allow a participant to join twice', async function()  {
        //     await challenge.joinChallenge();
        //     await expect(challenge.joinChallenge()).to.be.revertedWith("You already joined");
        // })

        // it('should allow a player to withdraw from the challenge (before start), while letting the challenge start when required without issues. Money should be sent back to him??', async function() {
        //     //5 players join
        //     await challenge.joinChallenge();
        //     await challenge.connect(signers[1]).joinChallenge();
        //     await challenge.connect(signers[2]).joinChallenge();
        //     await challenge.connect(signers[3]).joinChallenge();
        //     await challenge.connect(signers[4]).joinChallenge();

        //     //one player withdraws from challenge
        //     expect(
        //         await token.balanceOf(signers[2].address)
        //     ).to.equal(0);

        //     await challenge.connect(signers[2]).withdrawFromChallenge();

        //     //His balance should be 1000
        //     expect(
        //         await token.balanceOf(signers[2].address)
        //     ).to.equal(1000);

        //     const player1 = await challenge.players(0);
        //     expect(player1[0]).to.equal(signers[0].address);

        //     const player2 = await challenge.players(1);
        //     expect(player2[0]).to.equal(signers[1].address);

        //     const player3 = await challenge.players(2);
        //     expect(player3[0]).to.equal(signers[4].address);

        //     const player4 = await challenge.players(3);
        //     expect(player4[0]).to.equal(signers[3].address);

        //     //the 3rd player should not be in the array anymore, this should revert
        //     await expect(
        //         challenge.players(4)
        //     ).to.be.reverted;

        //     //Admin successfully starts challenge
        //     await challenge.startChallenge();

        //     expect(
        //        await challenge.currentStatus()
        //     ).to.equal(ChallengeStatus.OngoingChallenge);
        // })

        // it('should not allow a player to withdraw from the challenge if he hasnt joined', async function() {
        //     //try to withdraw without having joined, reverts
        //     await expect(
        //        challenge.withdrawFromChallenge()
        //     ).to.be.revertedWith("You are not in players list");
        // })

        // it('should allow a player to join, withdraw and then join again the challenge', async function() {
        //     await challenge.joinChallenge();
        //     await challenge.withdrawFromChallenge();
        //     await expect(
        //        challenge.joinChallenge()
        //     ).to.not.be.reverted
        // })

        // it('should not allow to start the challenge if there is less than 2 players', async function() {
        //     challenge.joinChallenge();
        //     await expect(
        //         challenge.startChallenge()
        //     ).to.be.revertedWith("Not enough players to start the challenge")
        // })


        // it("should allow the admin to go to the next state", async function() {
        //     await challenge.joinChallenge();
        //     await challenge.connect(signers[1]).joinChallenge();
        //     await challenge.startChallenge();
        //     expect(
        //        await challenge.currentStatus()
        //     ).to.equal(ChallengeStatus.OngoingChallenge);
        // })

    });

    // describe("gathering players state (FOR GROUP MODE SPECIFIC TESTS)", function () {

    //     let challenge;
    //     let signers;
    //     let bid;
    //     let token;
        
    //     //Function for using the group fixture with 'loadFixture'
    //     async function groupModeFixture() {
    //         return await deployedChallengeFixtureBase('group');
    //     }

    //     beforeEach(async function () {
    //         //Deploying in group mode
    //         ({challenge, signers, bid, token} = await loadFixture(groupModeFixture));
    //     });

    //     it('FOR GROUP MODE : the stored array of players should be correct', async function() {
    //         await challenge.connect(signers[0]).joinChallenge()
    //         await challenge.connect(signers[1]).joinChallenge()
    //         await challenge.connect(signers[2]).joinChallenge()
    //         await challenge.connect(signers[3]).joinChallenge()
            
    //         const player1 = await challenge.players(0);
    //         expect(player1[0]).to.equal(signers[0].address);

    //         const player2 = await challenge.players(1);
    //         expect(player2[0]).to.equal(signers[1].address);

    //         const player3 = await challenge.players(2);
    //         expect(player3[0]).to.equal(signers[2].address);

    //         const player4 = await challenge.players(3);
    //         expect(player4[0]).to.equal(signers[3].address);

    //     })

    //     it('FOR GROUP MODE : should not allow a player to join if he is not among those chosen by the admin at creation', async function() {
    //         await expect(
    //             challenge.connect(signers[5]).joinChallenge()
    //         ).to.be.revertedWith("You are not allowed to join this challenge.")
    //     })
    // })


    //state OngoingChallenge
    // describe('ongoing challenge state', function() { 
    //     let challenge;
    //     let signers;
    //     beforeEach(async function () {
    //         ({challenge, signers} = await loadFixture(OngoingChallengeFixture));
    //     });

    //     it('state should be "OngoingChallenge" during the challenge. ', async function() {
    //         expect(await challenge.currentStatus()).to.equal(ChallengeStatus.OngoingChallenge);
    //     })
    // });





})