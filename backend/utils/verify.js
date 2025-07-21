const hre = require("hardhat");

async function verify(contractAddress, args=[]){
    console.log('verifying contract')
    try{
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: args || [],
        })
    }
    catch(e){
        if(e.message.toLowerCase().includes('already verified')){
            console.log(">> Contract already verified")
        }else{
            console.error(">> Verification error:", e);
        }
    }
}
module.exports = { verify };