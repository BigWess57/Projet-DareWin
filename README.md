# Projet-DareWin

L'appli de défis entre amis!
DareWin – Plateforme de challenge décentralisée sur Ethereum

## Table des matières
🚀 [Installation](#installation)

🛠 [Architecture](#architecture)

📖 [Usage](#usage)

🧪 [Tests & CI](#tests-&-ci)

🔗 [Liens utiles](#liens-utiles)

## Installation
```
git clone https://github.com/BigWess57/Projet-DareWin.git
```

Pour Installer les dépendances pour le frontend et le backend :
```
cd frontend
npm ci
cd ../backend
npm ci
```

## Architecture
/frontend : React + Tailwind / Wagmi + Viem + Rainbowkit

/backend : Hardhat + Solidity

## Usage
Lancer la blockchain de dev :
```
cd backend/
npx hardhat node
```
Déployer les contrats :
```
npx hardhat run scripts/deploy.js --network localhost
```
Démarrer le frontend :
```
cd frontend/
npm run dev
```
## Tests & CI
Backend tests : 
```
cd backend/ 
npx hardhat test
```

Github workflow : backend tests executés on commit

## Liens utiles
Documentation Hardhat : https://hardhat.org/hardhat-runner/docs/getting-started

Docs OpenZeppelin : https://docs.openzeppelin.com/
