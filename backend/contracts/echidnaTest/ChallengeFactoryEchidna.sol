// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./ChallengeFactoryTestable.sol";
import "../DareWinTokenERC20.sol";

/// @notice Echidna test harness for ChallengeFactory
contract ChallengeFactoryEchidna {
    ChallengeFactoryTestable public immutable factory;
    DareWin public immutable token;
    address public constant FEE_RECEIVER = address(0x1234);
    address public constant TOKEN_OWNER = address(0x5678);

    // Track created challenges for property testing
    address[] public createdChallenges;
    uint256 public attemptedCreations;
    
    constructor() {
        // Deploy mock token
        token = new DareWin(TOKEN_OWNER);
        // Deploy factory
        factory = new ChallengeFactoryTestable(token, FEE_RECEIVER);
    }
    
    // Helper function to create challenges with random parameters
    function createRandomChallenge(
        uint64 duration,
        uint128 bid,
        bytes32 merkleRoot
    ) public {
        attemptedCreations++;
        
        // Ensure valid parameters to avoid reverts
        if (duration == 0) duration = 1;
        if (bid == 0) bid = 1;
        
        uint256 beforeCount = factory.totalChallengesCreated();
        
        factory.createChallenge(
            duration,
            bid,
            "Test Challenge",
            merkleRoot,
            "QmTest"
        );
        
        // Track the challenge (approximate address tracking)
        uint256 afterCount = factory.totalChallengesCreated();
        if (afterCount > beforeCount) {
            // Challenge was created successfully
        }
    }
    
    // ========== PROPERTY TESTS ==========
    
    /// @notice Immutable variables should never change
    function echidna_immutable_token_address() public view returns (bool) {
        return address(factory.getDareWinToken()) == address(token);
    }
    
    /// @notice Immutable fee receiver should never change
    function echidna_immutable_fee_receiver() public view returns (bool) {
        return factory.getFeeReceiver() == FEE_RECEIVER;
    }
    
    /// @notice Total challenges created should only increase
    function echidna_monotonic_challenge_count() public view returns (bool) {
        return factory.totalChallengesCreated() <= attemptedCreations;
    }
    
    /// @notice Total challenges should never overflow (reasonable bound)
    function echidna_no_counter_overflow() public view returns (bool) {
        return factory.totalChallengesCreated() < type(uint256).max / 2;
    }
    
    // ========== ASSERTION TESTS ==========
    
    /// @notice Test that creating a challenge with valid params doesn't revert
    function createValidChallenge(uint64 duration, uint128 bid) public {
        // Bound inputs to valid ranges
        if (duration == 0) duration = 1;
        if (bid == 0) bid = 1;
        
        uint256 countBefore = factory.totalChallengesCreated();
        
        factory.createChallenge(
            duration,
            bid,
            "Valid Challenge",
            bytes32(uint256(17)),
            "QmValidCID"
        );
        
        uint256 countAfter = factory.totalChallengesCreated();
        
        // Assert counter incremented by exactly 1
        assert(countAfter == countBefore + 1);
    }
    
    /// @notice Test parameter validation for duration
    function testInvalidDuration() public {
        bool reverted = false;
        try factory.createChallenge(
            0, // Invalid: duration = 0
            100,
            "Invalid Duration",
            bytes32(uint256(17)),
            "QmCID"
        ) {
            reverted = false;
        } catch {
            reverted = true;
        }
        assert(reverted); // Should revert
    }
    
    /// @notice Test parameter validation for merkle root
    function testInvalidMerkleRoot() public {
        bool reverted = false;
        try factory.createChallenge(
            3600,
            100,
            "Invalid Players",
            bytes32(0),// Invalid: merkleRoot = 0
            "QmCID"
        ) {
            reverted = false;
        } catch {
            reverted = true;
        }
        assert(reverted); // Should revert
    }
    
    /// @notice Test parameter validation for bid
    function testInvalidBid() public {
        bool reverted = false;
        try factory.createChallenge(
            3600,
            0, // Invalid: bid = 0
            "Invalid Bid",
            bytes32(uint256(17)),
            "QmCID"
        ) {
            reverted = false;
        } catch {
            reverted = true;
        }
        assert(reverted); // Should revert
    }
}
