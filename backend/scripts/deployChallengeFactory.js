const hre = require("hardhat");
const {ethers} = hre
const {verify} = require("../utils/verify");

async function main() {
    const signers = await ethers.getSigners()

    const isLocalhost = network.name.includes('localhost');  
   
   //Get DARE token first
    const DareWin = await ethers.getContractFactory("DareWinNew");
    let DareWinToken;
    if(isLocalhost){
        DareWinToken = DareWin.attach("0x5fbdb2315678afecb367f032d93f642f64180aa3")
    }else {
        //enter Right address DEPENDING ON NETWORK (SEPOLIA, HOLESKY...)
        DareWinToken = DareWin.attach("0x7f0f1C236e8000A752FbbCF371031B0A7b0cD604")
    }   

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
    const ChallengeFactory = await ethers.deployContract("ChallengeFactoryNew", [DareWinToken.target, signers[0].address]);
// const challengeFactory = await ethers.getContractFactory("ChallengeFactory");
// const ChallengeFactory = challengeFactory.attach("0xF5b33B18eF224357aFB475Cbc75cae3084da46FA")
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