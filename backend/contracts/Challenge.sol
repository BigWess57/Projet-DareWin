// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

import "./DareWinTokenERC20.sol";

contract Challenge is Ownable/*, AutomationCompatibleInterface*/{

    // Énumération qui définit tous les états possibles du processus de défi
    enum ChallengeStatus {
        // État initial : enregistrement des joueurs
        GatheringPlayers,
        // État 
        // WaitingForChallenge,
        // État 
        OngoingChallenge,
        // État
        // WaitingForVote,
        // État de vote
        VotingForWinner,
        // État final 
        ChallengeWon
    }

    struct Player {
        // address of player
        address playerAddress;
        // number of votes received
        uint voteCount;
    }

    uint256 public duration;
    uint256 public maxPlayers;
    uint256 public bid;
    string public description;
    bool private groupMode;

    DareWin private dareWinToken;

    address private feeReceiver;

    uint256 private currentPlayerNumber;

    uint256 private challengeStartTimestamp;
    uint256 private voteForWinnerStarted;
    uint256 public minimumDelayBeforeEndingVote = 1 hours;

    ChallengeStatus public currentStatus;

    address[] public challengeWinners;
    uint256 public highestVotes;
    
    mapping (address => bool) isAllowed;
    mapping (address => bool) hasJoined;
    mapping (address => bool) hasVoted;
    Player[] public players;

//Hardcoded FOR NOW
//Fee tier caps
    uint256 private feeTierBronzeCap;
    uint256 private feeTierSilverCap;
    uint256 private feeTierGoldCap;

//% of fee
    uint256 private feeTierBronze = 5;
    uint256 private feeTierSilver = 4;
    uint256 private feeTierGold = 3;
    uint256 private feeTierPlatinum = 2;

    uint256 private totalFee;

    // mapping (address => uint256) public pendingWithdrawals;

    event PlayerJoined(address player);
    event PlayerWithdrawn(address player);
    event ChallengeStarted(uint256 startingTime);
    event ChallengeEnded(uint256 endTime);
    event PlayerVoted(address voter, address votedFor);
    event VoteEnded(address[] challengeWinners);
    event PrizeSent(address winnerAddress, uint256 prizeShare);


    constructor(address initialOwner, DareWin _tokenAddress, uint256 _duration, uint256 _maxPlayers, uint256 _bid, string memory _description, address _feeReceiver, bool _groupMode, address[] memory _group) Ownable(initialOwner) {
        dareWinToken=_tokenAddress;
        duration=_duration;
        maxPlayers=_maxPlayers;
        bid=_bid;
        description=_description;
        feeReceiver=_feeReceiver;

        groupMode=_groupMode;
        //If group mode, store the predefined players from _group[] in the players[] array
        if(groupMode){
            require(
                _group.length > 1,
                "The predefined group of players is too small. There should be a minimum of 2 players per challenge"
            );
            for (uint i; i < _group.length; i++) {
                players.push(Player(_group[i], 0));
                isAllowed[_group[i]] = true;
            }
        }

        //fee tier setup (hardcoded FOR NOW)
        feeTierBronzeCap = 10000 * 10 ** dareWinToken.decimals();
        feeTierSilverCap = 50000 * 10 ** dareWinToken.decimals();
        feeTierGoldCap = 100000 * 10 ** dareWinToken.decimals();
    }

    //Modifiers
    modifier isCorrectState(ChallengeStatus _expectedState) {
        require(currentStatus == _expectedState, "Not allowed in this state");
        _;
    }

    //Special modifier for voteForWinner function: set state to Voting and start the voting timer (if state is OngoingChallenge)
    modifier isChallengeOver(){
        if(currentStatus == ChallengeStatus.OngoingChallenge){
             require(challengeStartTimestamp + duration <= block.timestamp, "You are not allowed to vote now");

            currentStatus = ChallengeStatus.VotingForWinner;
            voteForWinnerStarted=block.timestamp;
            emit ChallengeEnded(voteForWinnerStarted);
        }
        _;
    }
        

    function calculateFee() view internal returns(uint256){
        uint256 balance = dareWinToken.balanceOf(msg.sender);
        if (balance <= feeTierBronzeCap) {
            return bid/100*feeTierBronze;
        } else if (balance <= feeTierSilverCap) {
            return bid/100*feeTierSilver;
        } else if (balance <= feeTierGoldCap) {
            return bid/100*feeTierGold;
        } else {
            return bid/100*feeTierPlatinum;
        }
    }

    function joinChallenge() external isCorrectState(ChallengeStatus.GatheringPlayers) {
        require(currentPlayerNumber < maxPlayers, "This challenge is already full");
        require(!hasJoined[msg.sender], "You already joined"); 
        //If in group mode, dont allow a non authorized player to join
        if(groupMode){
            require(isAllowed[msg.sender] == true, "You are not allowed to join this challenge.");
        }

        //Check allowance of player
        require(dareWinToken.allowance(msg.sender, address(this)) >= bid, "Need prior approval for token spending");
        
        hasJoined[msg.sender] = true;
        currentPlayerNumber++;

        totalFee += calculateFee();
        
        players.push(Player(msg.sender, 0));
        emit PlayerJoined(msg.sender);
    }

    function withdrawFromChallenge() external isCorrectState(ChallengeStatus.GatheringPlayers) {
        for (uint i; i < players.length; i++) {
            if (players[i].playerAddress == msg.sender) {
                // Remove player from array by swapping with last and popping
                players[i] = players[players.length - 1];
                players.pop();
                
                emit PlayerWithdrawn(msg.sender);
                return;
            }
        }
        revert("You are not in players list");
    }


    function startChallenge() external onlyOwner isCorrectState(ChallengeStatus.GatheringPlayers) {
        require(players.length > 1, "Not enough players to start the challenge");

        //transfers tokens from all players to this contract
        for (uint i; i < players.length; i++) {
            require(
                dareWinToken.transferFrom(players[i].playerAddress, address(this), bid),
                "Transfer failed"
            );
        }

        currentStatus = ChallengeStatus.OngoingChallenge;
        challengeStartTimestamp = block.timestamp;
        emit ChallengeStarted(challengeStartTimestamp);
    }


    function voteForWinner(address _playerAddress) external isChallengeOver isCorrectState(ChallengeStatus.VotingForWinner) {
        require(!hasVoted[msg.sender], "You have already voted.");
        require(hasJoined[msg.sender], "You are not a player. You cannot vote for winner.");
        // require(hasJoined[_playerAddress], "You cannot vote for a player that has not joined the challenge.");

        for(uint i = 0; i < players.length; i++){
            if(_playerAddress == players[i].playerAddress){
                players[i].voteCount++;
                hasVoted[msg.sender] = true;

                //Decrease the currentPlayerNumber, to track how many people have voted
                currentPlayerNumber--;

                // update winner if needed
                // If there is a tie, add value to array
                if (players[i].voteCount == highestVotes) {
                    challengeWinners.push(_playerAddress);
                }
                //If there is a clear winner, delete array and update winner
                if (players[i].voteCount > highestVotes) {
                    highestVotes = players[i].voteCount;
                    delete challengeWinners;
                    challengeWinners.push(_playerAddress);
                }

                emit PlayerVoted(msg.sender ,_playerAddress);

                return; // get out after player found
            }
        }
    }

    function endWinnerVote() public isCorrectState(ChallengeStatus.VotingForWinner) {
        require(currentPlayerNumber==0 || (voteForWinnerStarted + minimumDelayBeforeEndingVote <= block.timestamp), "Not all player have voted for a winner yet (and minimum delay has not passed)");
        uint winnerCount = challengeWinners.length;
        require(winnerCount > 0, "Winner not set");

        //prize set to withdrawal for winner
        uint256 totalPrize = dareWinToken.balanceOf(address(this));

        // apply fee
        uint256 remainingPrize = totalPrize - totalFee;//totalPrize / 20;

        // Part per winner (equal between all)
        uint256 share = remainingPrize / winnerCount;
        // uint256 share = totalPrize / winnerCount;
        require(share > 0, "Prize too small to distribute");

        // attribution
        for (uint i = 0; i < winnerCount; i++) {
            address winner = challengeWinners[i];
            // pendingWithdrawals[winner] += share;
            require(
                dareWinToken.transfer(winner, share),
                "Token transfer failed"
            );
            emit PrizeSent(winner, share);
        }

        // Send half of balance remaining (fee) to team
        uint256 fee = dareWinToken.balanceOf(address(this))/2;
        require(
            dareWinToken.transfer(feeReceiver, fee), "Fee transfer failed"
        );

        //BURN the rest
        dareWinToken.burn(dareWinToken.balanceOf(address(this)));


        // emit VoteEnded(challengeWinners);
         

        currentStatus = ChallengeStatus.ChallengeWon;
    }


    ///Chainlink automation functions
    // function checkUpkeep(bytes calldata)
    //     external
    //     view
    //     override
    //     returns (bool upkeepNeeded, bytes memory)
    // {
    //     upkeepNeeded = (
    //       currentStatus == ChallengeStatus.VotingForWinner && 
    //       (currentPlayerNumber == 0 || (voteForWinnerStarted + minimumDelayBeforeEndingVote <= block.timestamp))
    //     );
    // }

    // function performUpkeep(bytes calldata) external override {
    //     require(
    //       currentPlayerNumber == 0 || (voteForWinnerStarted + minimumDelayBeforeEndingVote <= block.timestamp),
    //       "Upkeep conditions not met"
    //     );
    //     endWinnerVote(); // ta logique de clôture
    // }

}
