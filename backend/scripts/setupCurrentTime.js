const hre = require("hardhat");
const { ethers } = hre;
const { time } = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
    console.log("🔄 Synchronizing fork time to system time...");

    // Get the current real-world time (seconds)
    const currentRealTime = Math.floor(Date.now() / 1000);

    // Get the current blockchain time
    const latestBlock = await ethers.provider.getBlock("latest");
    const chainTime = latestBlock?.timestamp || 0;

    console.log(
        `   Current Chain Time: ${new Date(chainTime * 1000).toLocaleString()}`,
    );
    console.log(
        `   Target System Time: ${new Date(
            currentRealTime * 1000,
        ).toLocaleString()}`,
    );

    // Safety Check: We can only move time FORWARD
    if (currentRealTime <= chainTime) {
        console.log(
            "⚠️  Chain time is already ahead or equal to system time. No action needed.",
        );
        return;
    }

    // This effectively mines a new block with the timestamp set to currentRealTime
    await time.increaseTo(currentRealTime);

    console.log("✅ Time successfully synced! The chain is now live.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
