const hre = require("hardhat");
const {ethers} = hre

async function main() {
    const signers = await ethers.getSigners()

    //Deploy DARE token first
    const DareWinToken = await ethers.deployContract("DareWin", [signers[0].address]);
    await DareWinToken.deploymentTransaction()?.wait();
    console.log(`DARE token deployed to ${DareWinToken.target}`)

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

    //Challenge
    const duration = 1n;
    const maxPlayers = 5n;
    const bid = ethers.parseUnits("1000", await DareWinToken.decimals());
    const description = "test";

    //Deploy a single challenge for now
    const Challenge = await ethers.deployContract("Challenge", [DareWinToken.target, duration, maxPlayers, bid, description, signers[0].address, false, []]);

    await Challenge.deploymentTransaction()?.wait();
    console.log(`Challenge deployed to ${Challenge.target}`)

    const challengeDesc = await Challenge.description();
    console.log(`Description : "${challengeDesc}"`)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})