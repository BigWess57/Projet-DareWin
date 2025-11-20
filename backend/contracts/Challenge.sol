// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./DareWinTokenERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

import "hardhat/console.sol";

/// @title Challenge
/// @notice Manages a DARE-token challenge: creation, participation, voting, and prize distribution.
contract Challenge is Ownable{

    // Custom Errors
    error ZeroAddressFeeReceiver();
    error ZeroAddressToken();
    error MerkleRootRequired();
    error IPFSCidEmpty();
    error InsufficientPlayers();
    error InvalidDuration();
    error InsufficientBid();
    error InvalidState();
    error VotingNotAllowed();
    error NotWhitelisted();
    error ChallengeFull();
    error AlreadyJoined();
    error TransferFailed();
    error NotJoined();
    error InsufficientPlayersToStart();
    error NotAPlayer();
    error AlreadyVoted();
    error InvalidVoteTarget();
    error VotingStillOngoing();
    error NotAWinner();
    error PrizeAlreadyWithdrawn();
    error FeeTransferFailed();


    /// @notice Possible states of a challenge
    enum ChallengeStatus {
        GatheringPlayers,
        OngoingChallenge,
        VotingForWinner,
        ChallengeWon
    }

    /// @notice Structure representing a participating player
    struct Player {
        /// @notice has Player joined
        bool hasJoined;
        /// @notice has Player voted
        bool hasVoted;
        /// @notice has Player withdrawn his prize
        bool hasWithdrawn;
        /// @notice Number of votes received
        uint32 voteCount;
    }

    // =====================
    // IMMUTABLE & CONSTANT 
    // =====================
    DareWin private immutable dareWinToken;
    bytes32 public immutable merkleRoot;
    uint128 public immutable bid;
    uint128 private immutable feeTierBronzeCap;
    uint128 private immutable feeTierSilverCap;
    uint128 private immutable feeTierGoldCap;
    uint64 public immutable duration;
    uint32 public immutable maxPlayers;
    address private immutable feeReceiver;
    
    bool public immutable groupMode;

    uint8 constant private FEE_TIER_BRONZE = 5;
    uint8 constant private FEE_TIER_SILVER = 4;
    uint8 constant private FEE_TIER_GOLD = 3;
    uint8 constant private FEE_TIER_PLATINUM = 2;
    uint24 public constant MINIMUM_DELAY_BEFORE_ENDING_VOTE = 1 hours;

    // ==================
    // STORAGE VARIABLES 
    // ==================
    // SLOT 0: 29/32 bytes used
    uint64 public challengeStartTimestamp;      // 8 bytes
    uint64 public voteForWinnerStarted;         // 8 bytes
    uint32 public currentPlayerNumber;         // 4 bytes
    uint32 public highestVotes;                 // 4 bytes
    uint32 public numberOfWinners;              // 4 bytes
    ChallengeStatus public currentStatus;       // 1 byte

    // SLOT 1: 32/32 bytes used
    uint256 public prizePerWinner;              // 32 bytes

    // SLOT 2: Mapping key
    mapping (address => Player) public players; // 32 bytes

    // SLOT 3+: Dynamic strings
    string public ipfsCid;                      
    string public description;



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
    event PrizeWithdrawn(address winnerAddress, uint256 prizeShare);


    /// @notice Initializes a new Challenge contract
    /// @param initialOwner Owner of the contract (who can start/end challenge)
    /// @param _tokenAddress Address of the DARE ERC20 token contract
    /// @param _duration Duration of the challenge in seconds
    /// @param _maxPlayers Maximum participants for public mode
    /// @param _bid Amount of DARE token bid per player
    /// @param _description Short description of the challenge
    /// @param _feeReceiver Address receiving the platform fee
    /// @param _groupMode If true, only allowed group can join
    /// @param _merkleRoot merkle root of addresses allowed in group mode
    constructor(address initialOwner, DareWin _tokenAddress, uint64 _duration, uint32 _maxPlayers, uint128 _bid, string memory _description, address _feeReceiver, bool _groupMode, bytes32 _merkleRoot, string memory _ipfsCid) Ownable(initialOwner) {
        require(_feeReceiver != address(0), ZeroAddressFeeReceiver());

        if(_groupMode){
            require(_merkleRoot != bytes32(0), MerkleRootRequired());
            require(bytes(_ipfsCid).length != 0, IPFSCidEmpty());
            merkleRoot=_merkleRoot;
            ipfsCid= _ipfsCid;
        }else {
           require(_maxPlayers >= 2, InsufficientPlayers());
        }
        require(address(_tokenAddress) != address(0), ZeroAddressToken());
        require(_duration > 0, InvalidDuration());
        require(_maxPlayers >= 2, InsufficientPlayers());
        require(_bid > 0, InsufficientBid());

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
        require(currentStatus == _expectedState, InvalidState());
        _;
    }

    /// @notice Special modifier for voteForWinner function: Moves challenge to voting state once duration passes
    modifier isChallengeOver(){
        if(currentStatus == ChallengeStatus.OngoingChallenge){
            require(challengeStartTimestamp + duration <= block.timestamp, VotingNotAllowed());

            currentStatus = ChallengeStatus.VotingForWinner;
            voteForWinnerStarted=uint64(block.timestamp);
            emit ChallengeEnded(voteForWinnerStarted);
        }
        _;
    }



    /// @notice Calculates the platform fee share based on winner's token holdings
    /// @return Fee amount in DARE tokens
    function _calculateFee(address winner, uint256 share) view internal returns(uint256){
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

    /// @notice Checks if an address is whitelisted in the challenge
    /// @param account Address of the player to check
    /// @param proof array of proofs needed for the merkle proof verification
    function _isWhitelisted(address account, bytes32[] calldata proof) view internal returns(bool) {
        bytes32 leaf = keccak256(abi.encode(keccak256(abi.encode(account))));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }


    

    /// @notice Join the challenge by approving the bid
    function joinChallenge(uint256 deadline, uint8 v, bytes32 r, bytes32 s, bytes32[] calldata proof) external isCorrectState(ChallengeStatus.GatheringPlayers) { 
        if(groupMode){
            require(_isWhitelisted(msg.sender, proof), NotWhitelisted());
        }else{
            require(currentPlayerNumber < maxPlayers, ChallengeFull());
        }        
        require(!players[msg.sender].hasJoined, AlreadyJoined()); 

        players[msg.sender].hasJoined = true;
        ++currentPlayerNumber;
        emit PlayerJoined(msg.sender);

        // Try permit, but ignore if it fails (handles front-running)
        try dareWinToken.permit(msg.sender, address(this), bid, deadline, v, r, s) {} catch {}
        
        // This will succeed whether permit worked or was front-run. it still won't if not enough allowance
        require(
            dareWinToken.transferFrom(msg.sender, address(this), bid),
            TransferFailed()
        );
    }

    /// @notice Withdraw from challenge before it starts
    function withdrawFromChallenge() external isCorrectState(ChallengeStatus.GatheringPlayers) {
        require(players[msg.sender].hasJoined, NotJoined());

        players[msg.sender].hasJoined = false;
        --currentPlayerNumber;
        emit PlayerWithdrawn(msg.sender);

        require(
            dareWinToken.transfer(msg.sender, bid),
            TransferFailed()
        ); 
    }

    /// @notice Starts the challenge and collects all bids into the contract
    function startChallenge() external onlyOwner isCorrectState(ChallengeStatus.GatheringPlayers) {
        require(currentPlayerNumber > 1, InsufficientPlayersToStart());

        currentStatus = ChallengeStatus.OngoingChallenge;
        challengeStartTimestamp = uint64(block.timestamp);
        emit ChallengeStarted(challengeStartTimestamp);
    }

    /// @notice Casts a vote for a given player after the challenge ends
    /// @param playerAddress Address of the player to vote for
    function voteForWinner(address playerAddress) external isChallengeOver isCorrectState(ChallengeStatus.VotingForWinner) {
        Player storage playerVoting = players[msg.sender];
        Player storage PlayerVotedFor = players[playerAddress];
        require(playerVoting.hasJoined, NotAPlayer());
        require(!playerVoting.hasVoted, AlreadyVoted());
        require(PlayerVotedFor.hasJoined, InvalidVoteTarget());

        ++PlayerVotedFor.voteCount;
        uint32 playerVotes = PlayerVotedFor.voteCount;
        playerVoting.hasVoted = true;
        emit PlayerVoted(msg.sender, playerAddress);

        --currentPlayerNumber;

        if (playerVotes == highestVotes) {
            ++numberOfWinners;
        }
        if (playerVotes > highestVotes) {
            numberOfWinners = 1;
            highestVotes = playerVotes;
        }
    }


    /// @notice Concludes voting and distributes prizes and fees automatically
    function endWinnerVote() external isCorrectState(ChallengeStatus.VotingForWinner) {
        require(currentPlayerNumber==0 || (voteForWinnerStarted + MINIMUM_DELAY_BEFORE_ENDING_VOTE <= block.timestamp), VotingStillOngoing());

        currentStatus = ChallengeStatus.ChallengeWon;

        uint256 total = dareWinToken.balanceOf(address(this));
        prizePerWinner = total / numberOfWinners;
        uint256 remainder = total % numberOfWinners;
          
        //Burn the tiny amount remaining
        dareWinToken.burn(remainder);
    }

    function withdrawPrize() external isCorrectState(ChallengeStatus.ChallengeWon) {
        Player storage currentPlayer = players[msg.sender];
        require(currentPlayer.voteCount == highestVotes, NotAWinner());
        require(!currentPlayer.hasWithdrawn, PrizeAlreadyWithdrawn());
        
        currentPlayer.hasWithdrawn = true;

        uint256 fee = _calculateFee(msg.sender, prizePerWinner);
        uint256 shareAfterFees = prizePerWinner - fee;

        uint256 feeToReceiver = fee / 2;

        emit PrizeWithdrawn(msg.sender, shareAfterFees);

        require(
            dareWinToken.transfer(msg.sender, shareAfterFees),
            TransferFailed()
        );
        require(
            dareWinToken.transfer(feeReceiver, feeToReceiver), FeeTransferFailed()
        );
        //Burn the rest
        dareWinToken.burn(fee - feeToReceiver);
    }
}