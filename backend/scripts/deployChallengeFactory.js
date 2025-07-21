const hre = require("hardhat");
const {ethers} = hre
const {verify} = require("../utils/verify");

async function main() {
    const signers = await ethers.getSigners()

    //Get DARE token first
    const DareWin = await ethers.getContractFactory("DareWin");
    const DareWinToken = DareWin.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")

    const isLocalhost = network.name.includes('localhost');

    //Send tokens to other signers (if localhost)
    if(isLocalhost){
        const amountToDistribute = ethers.parseUnits("1000", await DareWinToken.decimals());
        for (let i = 1; i < 6; i++) {
            await DareWinToken.transfer(signers[i].address, amountToDistribute);
            if(i==1){
            //Send a bit more to 2nd signer
                await DareWinToken.transfer(signers[1].address, ethers.parseUnits("20000", await DareWinToken.decimals()));  
            }

            const bal = await DareWinToken.balanceOf(signers[i].address);
            console.log("user " + signers[i].address + " has been sent a total of " + ethers.formatUnits(bal, await DareWinToken.decimals()) + " DARE")
        }
    }

    //Deploy the challenge factory
    const ChallengeFactory = await ethers.deployContract("ChallengeFactory", [DareWinToken.target, signers[0].address]);

    console.log('deploiement de la Challenge Factory en cours...');

    if(!isLocalhost){
        console.log('Attente de quelques blocs avant verification');
        await ChallengeFactory.deploymentTransaction()?.wait(5);
    }
    console.log(`ChallengeFactory deployed to ${ChallengeFactory.target}`)

    if(!isLocalhost) {
        console.log( 'Vérification du contrat intelligent ChallengeFactory...' )
        await verify(ChallengeFactory.target.toString(), [DareWinToken.target, signers[0].address])
        console.log( 'Contrat vérifié!' )
    }

}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})