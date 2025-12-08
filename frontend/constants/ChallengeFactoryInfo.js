export const factoryAbi=[
    {
      "inputs": [
        {
          "internalType": "contract DareWin",
          "name": "_tokenAddress",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_feeReceiver",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "ChallengeDeploymentFailed",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InsufficientBid",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InsufficientPlayers",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidDuration",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ZeroAddressFeeReceiver",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ZeroAddressToken",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "admin",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "challengeAddress",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "ChallengeCreated",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint64",
          "name": "duration",
          "type": "uint64"
        },
        {
          "internalType": "uint128",
          "name": "bid",
          "type": "uint128"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "bytes32",
          "name": "merkleRoot",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "ipfsCid",
          "type": "string"
        }
      ],
      "name": "createChallenge",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "isChallenge",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalChallengesCreated",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];