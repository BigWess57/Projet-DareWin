// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./DareWinTokenERC20.sol";

/// @title Challenge
/// @notice Manages a DARE-token challenge: creation, participation, voting, and prize distribution.
contract Challenge is Ownable{

    /// @notice Possible states of a challenge
    enum ChallengeStatus {
        GatheringPlayers,
        OngoingChallenge,
        VotingForWinner,
        ChallengeWon
    }

    /// @notice Structure representing a participating player
    struct Player {
        /// @notice Player's address
        address playerAddress;
        /// @notice Number of votes received
        uint8 voteCount;
    }

    uint64 public immutable duration;          
    uint64 private challengeStartTimestamp;    
    uint64 private voteForWinnerStarted;       
    uint24 public constant MINIMUM_DELAY_BEFORE_ENDING_VOTE = 1 hours; 
    uint8 public immutable maxPlayers;         
    uint8 private currentPlayerNumber;         
    bool public immutable groupMode;           
    uint8 public highestVotes;                 

    uint128 public immutable bid;              
    uint128 private immutable feeTierBronzeCap;
    uint128 private immutable feeTierSilverCap;
    uint128 private immutable feeTierGoldCap;  

    address private immutable feeReceiver;     

    uint8 constant private FEE_TIER_BRONZE = 5;
    uint8 constant private FEE_TIER_SILVER = 4;
    uint8 constant private FEE_TIER_GOLD = 3;
    uint8 constant private FEE_TIER_PLATINUM = 2;
    uint8 constant MAX_PLAYERS = 50;


    DareWin private immutable dareWinToken;
    string public description;
    
    ChallengeStatus public currentStatus;

    address[] public challengeWinners;

    mapping (address => bool) public isAllowed;
    mapping (address => bool) hasJoined;
    mapping (address => bool) hasVoted;
    Player[] public players;


    /// @notice Emitted when a player successfully joins
    /// @param player Address of the player who joined
    event PlayerJoined(address player);

    /// @notice Emitted when a player withdraws before challenge start
    /// @param player Address of the player who withdrew
    event PlayerWithdrawn(address player);

    /// @notice Emitted when the challenge begins
    /// @param startingTime Unix timestamp when the challenge started
    event ChallengeStarted(uint256 startingTime);

    /// @notice Emitted when the challenge time has ended and voting starts
    /// @param endTime Unix timestamp when voting began
    event ChallengeEnded(uint256 endTime);

    /// @notice Emitted when a vote is cast
    /// @param voter Address of the voter
    /// @param votedFor Address of the player voted for
    event PlayerVoted(address voter, address votedFor);

    /// @notice Emitted when voting closes and winners are known
    /// @param challengeWinners Array of winner addresses (can be multiple on ties)
    event VoteEnded(address[] challengeWinners);

    /// @notice Emitted when a prize share is sent to a winner
    /// @param winnerAddress Address of the winner
    /// @param prizeShare Amount of tokens sent as prize
    event PrizeSent(address winnerAddress, uint256 prizeShare);


    /// @notice Initializes a new Challenge contract
    /// @param initialOwner Owner of the contract (who can start/end challenge)
    /// @param _tokenAddress Address of the DARE ERC20 token contract
    /// @param _duration Duration of the challenge in seconds
    /// @param _maxPlayers Maximum participants for public mode
    /// @param _bid Amount of DARE token bid per player
    /// @param _description Short description of the challenge
    /// @param _feeReceiver Address receiving the platform fee
    /// @param _groupMode If true, only allowed group can join
    /// @param _group List of addresses allowed in group mode
    constructor(address initialOwner, DareWin _tokenAddress, uint64 _duration, uint8 _maxPlayers, uint128 _bid, string memory _description, address _feeReceiver, bool _groupMode, address[] memory _group) Ownable(initialOwner) {
        require(_feeReceiver != address(0), "the feeReceiver cannot be address 0!");
        if(_groupMode){
            require(
                _group.length > 1,
                "The predefined group of players is too small. There should be a minimum of 2 players per challenge"
            );
            require(
                _group.length <= MAX_PLAYERS,
                "No more than 50 players per challenge"
            );
            for (uint i; i < _group.length; i++) {
                require(_group[i] != address(0), "address 0 cannot be a player!");
                isAllowed[_group[i]] = true;
            }
        }else{
            require(
                _maxPlayers <= MAX_PLAYERS,
                "No more than 50 players per challenge"
            );
        }

        dareWinToken=_tokenAddress;
        duration=_duration;
        maxPlayers=_maxPlayers;
        bid=_bid;
        description=_description;
        feeReceiver=_feeReceiver;

        groupMode=_groupMode;
        

        //fee tier setup (hardcoded FOR NOW)
        feeTierBronzeCap = uint128(10000 * 10 ** dareWinToken.decimals());
        feeTierSilverCap = uint128(40000 * 10 ** dareWinToken.decimals());
        feeTierGoldCap = uint128(100000 * 10 ** dareWinToken.decimals());
    }

    /// @notice Validates that the function is called in the specified challenge status
    /// @param _expectedState The required state the challenge must be in
    modifier isCorrectState(ChallengeStatus _expectedState) {
        require(currentStatus == _expectedState, "Not allowed in this state");
        _;
    }


    /// @notice Special modifier for voteForWinner function: Moves challenge to voting state once duration passes
    modifier isChallengeOver(){
        if(currentStatus == ChallengeStatus.OngoingChallenge){
             require(challengeStartTimestamp + duration <= block.timestamp, "You are not allowed to vote now");

            currentStatus = ChallengeStatus.VotingForWinner;
            voteForWinnerStarted=uint64(block.timestamp);
            emit ChallengeEnded(voteForWinnerStarted);
        }
        _;
    }
        
    /// @notice Calculates the platform fee share based on winner's token holdings
    /// @return Fee amount in DARE tokens
    function calculateFee(address winner, uint256 share) view internal returns(uint256){

        uint256 balanceWinner = dareWinToken.balanceOf(winner);
        if (balanceWinner <= feeTierBronzeCap) {
            return share*FEE_TIER_BRONZE/100;
        } else if (balanceWinner <= feeTierSilverCap) {
            return share*FEE_TIER_SILVER/100;
        } else if (balanceWinner <= feeTierGoldCap) {
            return share*FEE_TIER_GOLD/100;
        } else {
            return share*FEE_TIER_PLATINUM/100;
        }
    }

    /// @notice Join the challenge by approving the bid
    function joinChallenge() external isCorrectState(ChallengeStatus.GatheringPlayers) {  
        if(groupMode){
            require(isAllowed[msg.sender], "You are not allowed to join this challenge.");
        }else{
            require(currentPlayerNumber < maxPlayers, "This challenge is already full");
        }
        require(!hasJoined[msg.sender], "You already joined"); 

        require(dareWinToken.allowance(msg.sender, address(this)) >= bid, "Need prior approval for token spending");
        
        hasJoined[msg.sender] = true;
        ++currentPlayerNumber;
        
        players.push(Player(msg.sender, 0));
        emit PlayerJoined(msg.sender);
    }

    /// @notice Withdraw from challenge before it starts
    function withdrawFromChallenge() external isCorrectState(ChallengeStatus.GatheringPlayers) {
        for (uint i; i < players.length; i++) {
            if (players[i].playerAddress == msg.sender) {
                players[i] = players[players.length - 1];
                players.pop();

                hasJoined[msg.sender] = false;
                --currentPlayerNumber;

                emit PlayerWithdrawn(msg.sender);
                return;
            }
        }
        revert("You are not in players list");
    }

    /// @notice Starts the challenge and collects all bids into the contract
    function startChallenge() external onlyOwner isCorrectState(ChallengeStatus.GatheringPlayers) {
        require(players.length > 1, "Not enough players to start the challenge");

        currentStatus = ChallengeStatus.OngoingChallenge;
        challengeStartTimestamp = uint64(block.timestamp);
        emit ChallengeStarted(challengeStartTimestamp);

        for (uint i; i < players.length; ++i) {
            require(
                dareWinToken.transferFrom(players[i].playerAddress, address(this), bid),
                "Transfer failed"
            );
        }

    }

    /// @notice Casts a vote for a given player after the challenge ends
    /// @param playerAddress Address of the player to vote for
    function voteForWinner(address playerAddress) external isChallengeOver isCorrectState(ChallengeStatus.VotingForWinner) {
        require(!hasVoted[msg.sender], "You have already voted.");
        require(hasJoined[msg.sender], "You are not a player. You cannot vote for winner.");

        uint players_length = players.length;
        for(uint i = 0; i < players_length; i++){
            if(playerAddress == players[i].playerAddress){
                ++players[i].voteCount;
                hasVoted[msg.sender] = true;
                emit PlayerVoted(msg.sender ,playerAddress);

                --currentPlayerNumber;

                if (players[i].voteCount == highestVotes) {
                    challengeWinners.push(playerAddress);
                    return;
                }
                if (players[i].voteCount > highestVotes) {
                    highestVotes = players[i].voteCount;
                    delete challengeWinners;
                    challengeWinners.push(playerAddress);
                    return;
                }
            }
        }
    }

    /// @notice Concludes voting and distributes prizes and fees automatically
    function endWinnerVote() public isCorrectState(ChallengeStatus.VotingForWinner) {
        require(currentPlayerNumber==0 || (voteForWinnerStarted + MINIMUM_DELAY_BEFORE_ENDING_VOTE <= block.timestamp), "Not all player have voted for a winner yet (and minimum delay has not passed)");
        uint winnerCount = challengeWinners.length;
        require(winnerCount > 0, "Winner not set");

        currentStatus = ChallengeStatus.ChallengeWon;

        uint256 totalPrize = dareWinToken.balanceOf(address(this));

        uint256 share = totalPrize / winnerCount;
        require(share > 0, "Prize too small to distribute");

        for (uint i = 0; i < winnerCount; i++) {
            address winner = challengeWinners[i];
            uint256 shareAfterFees = share - calculateFee(winner, share);

            emit PrizeSent(winner, shareAfterFees);
            require(
                dareWinToken.transfer(winner, shareAfterFees),
                "Token transfer failed"
            );
        }

        uint256 fee = dareWinToken.balanceOf(address(this))/2;
        require(
            dareWinToken.transfer(feeReceiver, fee), "Fee transfer failed"
        );

        dareWinToken.burn(dareWinToken.balanceOf(address(this)));
    }
}
