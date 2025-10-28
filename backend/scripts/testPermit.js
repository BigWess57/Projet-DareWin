const hre = require("hardhat");
const {ethers} = hre


function getTimestampInSeconds() {
    // returns current timestamp in seconds
    return Math.floor(Date.now() / 1000);
}

async function main() {
  
    const signers = await ethers.getSigners()

    //Deploy DARE token first
    const myToken = await ethers.deployContract("DareWin", [signers[0].address]);
    await myToken.deploymentTransaction()?.wait();
    console.log(`DARE token deployed to ${myToken.target}`)
  
    const tokenOwner = signers[0];
    const tokenReceiver = signers[1];

    // check account balances
    let tokenOwnerBalance = (await myToken.balanceOf(tokenOwner.address)).toString()
    let tokenReceiverBalance = (await myToken.balanceOf(tokenReceiver.address)).toString()

    console.log(`Starting tokenOwner balance: ${tokenOwnerBalance}`);
    console.log(`Starting tokenReceiver balance: ${tokenReceiverBalance}`);
  
    // set token value and deadline
    const value = ethers.parseEther("1");
    const deadline = getTimestampInSeconds() + 4200;
  
    // get the current nonce for the deployer address
    const nonces = await myToken.nonces(tokenOwner.address);
    const chain = await ethers.provider.getNetwork();

    // set the domain parameters
    const domain = {
      name: await myToken.name(),
      version: "1",
      chainId: chain.chainId,
      verifyingContract: myToken.target
    };
  
    // set the Permit type parameters
    const types = {
      Permit: [{
          name: "owner",
          type: "address"
        },
        {
          name: "spender",
          type: "address"
        },
        {
          name: "value",
          type: "uint256"
        },
        {
          name: "nonce",
          type: "uint256"
        },
        {
          name: "deadline",
          type: "uint256"
        },
      ],
    };
  
    // set the Permit type values
    const values = {
      owner: tokenOwner.address,
      spender: tokenReceiver.address,
      value: value,
      nonce: nonces,
      deadline: deadline,
    };

    // sign the Permit type data with the deployer's private key
    const signature = await tokenOwner.signTypedData(domain, types, values);
    console.log(signature)

    // split the signature into its components
    const sig = ethers.Signature.from(signature)
    console.log(sig)

    const v = sig.v ?? (27 + sig.yParity); // 27/28

    // // verify the Permit type data with the signature
    const recovered = ethers.verifyTypedData(
      domain,
      types,
      values,
      sig
    );
    console.log("expected owner:", tokenOwner.address);
    console.log("recovered address:", recovered);
  
    // get network gas price
    const gasPrice = (await ethers.provider.getFeeData()).gasPrice
  
    // permit the tokenReceiver address to spend tokens on behalf of the tokenOwner
    let tx = await myToken.connect(tokenReceiver).permit(
      tokenOwner.address,
      tokenReceiver.address,
      value,
      deadline,
      v,
      sig.r,
      sig.s, {
        gasPrice: gasPrice,
        gasLimit: 80000 //hardcoded gas limit; change if needed
      }
    );
  
    // await tx.wait(2) //wait 2 blocks after tx is confirmed
  
    // check that the tokenReceiver address can now spend tokens on behalf of the tokenOwner
    console.log(`Check allowance of tokenReceiver: ${await myToken.allowance(tokenOwner.address, tokenReceiver.address)}`);
  
    // transfer tokens from the tokenOwner to the tokenReceiver address
    tx = await myToken.connect(tokenReceiver).transferFrom(
      tokenOwner.address,
      tokenReceiver.address,
      value,
    );
  
    // await tx.wait(2) //wait 2 blocks after tx is confirmed

    // Get ending balances
    tokenOwnerBalance = (await myToken.balanceOf(tokenOwner.address)).toString()
    tokenReceiverBalance = (await myToken.balanceOf(tokenReceiver.address)).toString()

    console.log(`Ending tokenOwner balance: ${tokenOwnerBalance}`);
    console.log(`Ending tokenReceiver balance: ${tokenReceiverBalance}`);
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});