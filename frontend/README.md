## Projet-DareWin - Frontend

Frontend de l'application

# Description
UI en React 18, Tailwind CSS, form validation Zod, WalletConnect avec Rainbowkit

# Prérequis
Node.js ≥ 16
Environnement .env.local

# Installation
npm ci

# Scripts
npm run dev → démarre le serveur en mode développement

npm run build → génère la version de production

npm run preview → prévisualisation de la build prod

# Fonctionnement
Interaction avec les contrat a l'aide Wagmi Hooks + Viem

Page Home : présentation

Formulaire création : champs description, durée, mode public/groupe…

Page Challenge : rejoindre, withdraw, vote, withdraw prize


# Configuration & déploiement
Variables d’environnement à adapter pour la prod

Déployer sur Netlify / Vercel