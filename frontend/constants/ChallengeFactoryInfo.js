// export const factoryAddress="0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"; //EN LOCAL
export const factoryAddress="0xF5b33B18eF224357aFB475Cbc75cae3084da46FA"; //Holesky
// export const factoryAddress="0xDFA2097D946919A8A75238FbafDba221b02842A6"; //Sepolia
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
          "name": "blockNumber",
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
          "internalType": "uint8",
          "name": "maxPlayers",
          "type": "uint8"
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
          "internalType": "bool",
          "name": "groupMode",
          "type": "bool"
        },
        {
          "internalType": "address[]",
          "name": "group",
          "type": "address[]"
        }
      ],
      "name": "createChallenge",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]