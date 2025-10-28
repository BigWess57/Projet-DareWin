const hre = require("hardhat");
const {ethers} = hre


async function main() {
    const signers = await ethers.getSigners()

    //Deploy DARE token first
    const DareWinToken = await ethers.deployContract("DareWin", [signers[0].address]);
    console.log(`DARE Token deployed to ${DareWinToken.target}`)

    //Deploy Factory
    const ChallengeFactory = await ethers.deployContract("ChallengeFactory", [DareWinToken.target, signers[0].address]);
    console.log(`ChallengeFactory deployed to ${ChallengeFactory.target}`)

}
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})