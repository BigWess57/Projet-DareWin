## Smart contracts (Hardhat project)

# Description
Smart contracts Solidity (ChallengeFactory, Challenge, DareWinToken)

Utilisation de Hardhat, OpenZeppelin

# Prérequis

Hardhat CLI

Un RPC local ou remote

# Installation
```
npm ci
```

# Configuration réseau
.env avec :
```
MAINNET_RPC_URL=…
PRIVATE_KEY=…
ETHERSCAN_API=
```

# Scripts utiles
npx hardhat node → lance réseau local

npx hardhat compile → compile les contrats

npx hardhat test → exécute les tests

npx hardhat coverage → exécute les tests + checker le coverage

npx hardhat run scripts/deployChallengeFactory.js --network <network> → déploiement

# Tests
Unitaires : test/*.test.js


Resultats des tests + coverage :
Voir test-report/:
- Un fichier report.html → rapport lisible en navigateur
- Un report.json → données brutes au format JSON
