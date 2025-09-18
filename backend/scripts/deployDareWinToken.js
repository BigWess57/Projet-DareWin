const hre = require("hardhat");
const {ethers} = hre
const {verify} = require("../utils/verify");

async function main() {
    const signers = await ethers.getSigners()

    //Deploy DARE token first
    const DareWinToken = await ethers.deployContract("DareWinNew", [signers[0].address]);

    console.log('deploiement du token DARE en cours...');
    const isLocalhost = network.name.includes('localhost');

    if(!isLocalhost){
        console.log('Attente de quelques blocs avant verification');
        await DareWinToken.deploymentTransaction()?.wait(5);
    }
    console.log(`DARE Token deployed to ${DareWinToken.target}`)

    if(!isLocalhost) {
        console.log( 'Vérification du contrat intelligent du Token...' )
        // await verify(DareWinToken.target.toString(), [signers[0].address])
        await verify(DareWinToken.target, [signers[0].address])
        console.log( 'Contrat vérifié!' )
    }
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})