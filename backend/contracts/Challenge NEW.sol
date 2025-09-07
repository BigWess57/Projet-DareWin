// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./DareWinTokenERC20.sol";

/// @title Challenge
/// @notice Manages a DARE-token challenge: creation, participation, voting, and prize distribution.
contract ChallengeNew is Ownable{

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
    // uint64 private challengeStartTimestamp;    
    // uint64 private voteForWinnerStarted;       
    // uint24 public constant MINIMUM_DELAY_BEFORE_ENDING_VOTE = 1 hours; 
    uint8 public immutable maxPlayers;         
    // uint8 private currentPlayerNumber;         
    bool public immutable groupMode;           
    // uint8 public highestVotes;                 

    uint128 public immutable bid;              
    uint128 private immutable feeTierBronzeCap;
    uint128 private immutable feeTierSilverCap;
    uint128 private immutable feeTierGoldCap;  

    address private immutable feeReceiver;     

    uint8 constant private FEE_TIER_BRONZE = 5;
    uint8 constant private FEE_TIER_SILVER = 4;
    uint8 constant private FEE_TIER_GOLD = 3;
    uint8 constant private FEE_TIER_PLATINUM = 2;
    // uint8 constant MAX_PLAYERS = 50;


    DareWin private immutable dareWinToken;
    string public description;
    
    ChallengeStatus public currentStatus;

    // address[] public challengeWinners;

    mapping (address => bool) public isAllowed;
    // mapping (address => bool) hasJoined;
    // mapping (address => bool) hasVoted;
    // Player[] public players;

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
            for (uint i; i < _group.length; i++) {
                require(_group[i] != address(0), "address 0 cannot be a player!");
                isAllowed[_group[i]] = true;
            }
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

    /// @notice Join the challenge by approving the bid
    function joinChallenge() external isCorrectState(ChallengeStatus.GatheringPlayers) {  

    }

    /// @notice Withdraw from challenge before it starts
    function withdrawFromChallenge() external isCorrectState(ChallengeStatus.GatheringPlayers) {

    }

    /// @notice Starts the challenge and collects all bids into the contract
    function startChallenge() external onlyOwner isCorrectState(ChallengeStatus.GatheringPlayers) {

    }

    /// @notice Casts a vote for a given player after the challenge ends
    /// @param playerAddress Address of the player to vote for
    // function voteForWinner(address playerAddress) external isChallengeOver isCorrectState(ChallengeStatus.VotingForWinner) {

    // }

    /// @notice Concludes voting and distributes prizes and fees automatically
    function endWinnerVote() public isCorrectState(ChallengeStatus.VotingForWinner) {

    }
}
