const hre = require("hardhat");
const {ethers} = hre
const {verify} = require("../utils/verify");

// Minimal ABIs (reduces deployment size and improves speed)
const ROUTER_ABI = [
  // addLiquidityETH function
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  
  // Get quote for price calculation
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  
  // WETH address
  "function WETH() external pure returns (address)"
];

// Configuration
const config = {  
  // Contract addresses (for Base Sepolia OR forked local Mainnet)
  // Uniswap V2 Router02 
  routerAddress: network.name === "base" ? "0x1689E7B1F10000AE47eBfE339a4f69dECd19F602" : "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  // Factory address 
  factoryAddress: network.name === "base" ? "0x7Ae58f10f7849cA6F5fB71b7f45CB416c9204b1e" : "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  // deployed DARE token address
  tokenAddress: network.name === "base" ? "0xF5b33B18eF224357aFB475Cbc75cae3084da46FA" : "0xd31d3e1F60552ba8B35aA3Bd17c949404fdd12c4",

  // Liquidity amounts (1,000,000 DARE + 0.1 ETH)
  tokenAmount: ethers.parseEther("1000000"), // 1M * 10^18
  ethAmount: ethers.parseEther("0.1"), // 0.1 ETH
  
  // Slippage tolerance (2% = 200 basis points)
  slippageTolerance: 200, // basis points (1% = 100)
  
  // Transaction deadline (60 minutes from now)
  deadlineOffset: 60 * 60, // seconds
};


async function main() {
  const signers = await ethers.getSigners()

  console.log("🚀 Starting Liquidity Addition Script...");
  console.log(`Network: ${network.name}`);
  console.log(`Router: ${config.routerAddress}`);
  console.log(`Token: ${config.tokenAddress}`);
  console.log(`ETH Amount: ${ethers.formatEther(config.ethAmount)} ETH`);
  console.log(`DARE Amount: ${ethers.formatEther(config.tokenAmount)} DARE`);

  console.log(`Deployer: ${signers[0].address}`);

  // Validate configuration
  if (!ethers.isAddress(config.tokenAddress)) {
    throw new Error("❌ Invalid DARE token address in environment variables");
  }
  
  if (!ethers.isAddress(config.routerAddress)) {
    throw new Error("❌ Invalid Router address");
  }

  // Check ETH balance
  const ethBalance = await ethers.provider.getBalance(signers[0].address);
  if (ethBalance < config.ethAmount) {
    throw new Error(`❌ Insufficient ETH balance. Required: ${ethers.utils.formatEther(config.ethAmount)}, Found: ${ethers.formatEther(ethBalance)}`);
  }
  console.log(`✅ ETH balance sufficient: ${ethers.formatEther(ethBalance)} ETH`);
  
  // Create contract instances
  // const router = new ethers.Contract(config.routerAddress, ROUTER_ABI, signers[0]);
  // const router 
  // const token = new ethers.Contract(config.tokenAddress, ERC20_ABI, signers[0]);
  const DareWinContract = await ethers.getContractFactory("DareWin");
  const token = DareWinContract.attach(config.tokenAddress)

  const router = new ethers.Contract(config.routerAddress, ROUTER_ABI, signers[0]);

  // Check token balance
  const tokenBalance = await token.balanceOf(signers[0].address);
  if (tokenBalance < config.tokenAmount) {
    throw new Error(`❌ Insufficient DARE balance. Required: ${ethers.formatEther(config.tokenAmount)}, Found: ${ethers.formatEther(tokenBalance)}`);
  }
  console.log(`✅ DARE balance sufficient: ${ethers.formatEther(tokenBalance)} DARE`);
  
  // Check current allowance
  const currentAllowance = await token.allowance(signers[0].address, config.routerAddress);
  console.log(`Current allowance: ${ethers.formatEther(currentAllowance)} DARE`);
  
  // Step 1: Approve Router to spend DARE tokens (if needed)
  if (currentAllowance < config.tokenAmount) {
    console.log("\n📋 Step 1: Approving Router to spend DARE tokens...");
    
    // Approve exact amount (more secure than unlimited)
    const approveTx = await token.approve(config.routerAddress, config.tokenAmount, {
      gasLimit: 50000, // ERC20 approve is typically ~46k gas
    });
    
    console.log(`⏳ Approval transaction sent: ${approveTx.hash}`);
    
    // Wait for confirmation
    const approveReceipt = await approveTx.wait();
    console.log(`✅ Approved in block: ${approveReceipt.blockNumber}`);
    console.log(`Gas used: ${approveReceipt.gasUsed.toString()}`);
  } else {
    console.log("\n✅ Step 1: Router already has sufficient allowance, skipping approval");
  }
  
  // Step 2: Calculate min amounts with slippage
  console.log("\n📋 Step 2: Calculating slippage-tolerant amounts...");
  
  // For initial liquidity, slippage is not critical since you're setting the price
  // But we still apply it for best practices
  const slippageFactor = 10000n - BigInt(config.slippageTolerance);
  const amountTokenMin = (config.tokenAmount * slippageFactor) / 10000n;
  const amountETHMin = (config.ethAmount * slippageFactor) / 10000n;
  
  console.log(`Token Min (with slippage): ${ethers.formatEther(amountTokenMin)} DARE`);
  console.log(`ETH Min (with slippage): ${ethers.formatEther(amountETHMin)} ETH`);
  
  // Step 3: Add liquidity
  console.log("\n📋 Step 3: Adding liquidity to DARE/ETH pool...");
  
  // Calculate deadline
  const deadline = Math.floor(Date.now() / 1000) + config.deadlineOffset;
  console.log(`Deadline: ${new Date(deadline * 1000).toLocaleString()}`);
  
  // Call addLiquidityETH
  // Notes:
  // - payable: we pass { value: config.ethAmount }
  // - to: send LP tokens back to deployer
  // - deadline: unix timestamp
  const tx = await router.addLiquidityETH(
    config.tokenAddress,           // token
    config.tokenAmount,            // amountTokenDesired
    amountTokenMin,                // amountTokenMin
    amountETHMin,                  // amountETHMin
    signers[0].address,              // to (LP token recipient)
    deadline,                      // deadline
    {
      value: config.ethAmount,     // ETH sent with transaction
      // gasLimit: 300000,            // Add liquidity is ~250k gas, add buffer
    }
  );
  
  console.log(`⏳ Liquidity transaction sent: ${tx.hash}`);
  console.log("Waiting for confirmation...");
  
  // Step 4: Wait for transaction confirmation
  const receipt = await tx.wait();
  console.log(`\n✅ Liquidity added successfully in block: ${receipt.blockNumber}`);
  console.log(`Transaction hash: ${receipt.hash}`);
  
  // Step 5: Parse events (optional)
  console.log("\n📊 Transaction Details:");
  
  // Query Factory to get created Pair
  const factory = new ethers.Contract(
    config.factoryAddress, // Base V2 Factory
    ["function getPair(address tokenA, address tokenB) view returns (address)"],
    signers[0]
  );
  const weth = await router.WETH(); // Get WETH address
  const pairAddress = await factory.getPair(config.tokenAddress, weth);

  if (pairAddress === ethers.ZeroAddress) {
    console.log("⚠️  Pair not found - may use existing pool");
  } else {
    console.log(`✅ Created Pair address: ${pairAddress}`);
  }
  
  // Calculate gas costs
  const gasUsed = receipt.gasUsed;
  const gasPrice = tx.gasPrice;
  const totalGasCost = gasUsed * gasPrice;
  console.log(`Gas used: ${gasUsed.toString()}`);
  console.log(`Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
  console.log(`Total gas cost: ${ethers.formatEther(totalGasCost)} ETH`);
  
  console.log("\n🎉 Script completed successfully!");
}

main() 
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Script failed:");
    console.error(error);
    
    // Print important debugging info
    if (error.code === "INSUFFICIENT_FUNDS") {
      console.error("\n💡 Suggestion: Get more test ETH from https://www.basefaucet.xyz");
    } else if (error.code === "NETWORK_ERROR") {
      console.error("\n💡 Suggestion: Check your RPC URL and network connection");
    } else if (error.message.includes("reverted")) {
      console.error("\n💡 Common causes:");
      console.error("- Insufficient token allowance (run script again)");
      console.error("- Token transfer tax/fee mechanism");
      console.error("- Router not approved to spend tokens");
      console.error("- Slippage too low");
    }
    
    process.exit(1);
  });