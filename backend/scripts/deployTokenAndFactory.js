const hre = require("hardhat");
const {ethers} = hre
const {verify} = require("../utils/verify");

async function main() {
    const signers = await ethers.getSigners()

    /********************************************/
    /********* Deploy DARE token first **********/
    /********************************************/

    const DareWinToken = await ethers.deployContract("DareWinNew", [signers[0].address]);

    const isLocalhost = network.name.includes('localhost');
    if(typeof network.name === "string"){
        console.log(">>> Deploiement sur le réseau : ", network.name.toUpperCase())
    }

    console.log('deploiement du token DARE en cours...');

    if(!isLocalhost){
        console.log('Attente de quelques blocs avant verification');
        await DareWinToken.deploymentTransaction()?.wait(3);
    }
    console.log(`DARE Token deployed to ${DareWinToken.target}`)

    if(!isLocalhost) {
        console.log( 'Vérification du contrat intelligent du Token...' )
        // await verify(DareWinToken.target.toString(), [signers[0].address])
        try{
            await verify(DareWinToken.target, [signers[0].address])
            // await verify("0x93C1101D99048DFF77844B32081729f39F501903", [signers[0].address])
        }
        catch{
            console.error('Could not verify the contract.')
        }
        
    }

    /**************************************************/
    /********* Deploy Challenge Factory next **********/
    /**************************************************/

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
        await ChallengeFactory.deploymentTransaction()?.wait(3);
    }
    console.log(`ChallengeFactory deployed to ${ChallengeFactory.target}`)

    if(!isLocalhost) {
        console.log( 'Vérification du contrat intelligent ChallengeFactory...' )

        try {
            await verify(ChallengeFactory.target.toString(), [DareWinToken.target, signers[0].address])
            // await verify("0x411F9f26C89CFe22a5f952A1995C4250f383A387", ["0x93C1101D99048DFF77844B32081729f39F501903", signers[0].address])
        }
        catch {
            console.error('Could not verify the contract.')
        }
        
        
    }

}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})