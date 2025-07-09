const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { assert, expect } = require("chai")
const { ethers } = require("hardhat")

describe("DareWin Token", function () {
    async function deployDareWinTokenFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, account2, account3] = await ethers.getSigners();

        // We fork the Ethereum Mainnet, we need to use the UniswapV2 Router and Factory addresses
        const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
        const uniswapFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    
        // Deploy the DareWinToken contract
        const DareWinToken = await ethers.getContractFactory("DareWin");
        const dareWinToken = await DareWinToken.deploy(owner.address, uniswapRouterAddress, uniswapFactoryAddress);

        return { dareWinToken, owner, account2, account3 };
    }

    describe("Deployment", function () {
        // it("Should deploy the smart contract with the right owner", async function () {
        //     const { dareWinToken, owner, account2, account3 } = await loadFixture(deployDareWinTokenFixture);
        //     // Check if the contract owner is the owner of the fixture
        //     const contractOwner = await dareWinToken.owner();
        //     assert(contractOwner === owner.address);
        // });

        // it('Should deploy the smart contract and mint the tokens to the owner', async function() {
        //     const { benBKToken, owner, account2, account3 } = await loadFixture(deployBenBKTokenFixture);
        //     // Check if the owner has the right amount of tokens
        //     const balanceOfBenBKToken = await benBKToken.balanceOf(owner.address);
        //     const expectedBenBKTokenBalanceOfOwner = hre.ethers.parseEther('1000000');
        //     assert(balanceOfBenBKToken === expectedBenBKTokenBalanceOfOwner);
        // })

        // it('Should get the UniswapV2 Pool Information', async function() {
        //     const { benBKToken, owner, account2, account3 } = await loadFixture(deployBenBKTokenFixture);

        //     // We fork the Ethereum Mainnet, we need to use the UniswapV2 Router and Factory addresses
        //     const uniswapRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
        //     const uniswapFactoryAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

        //     // Get the UniswapV2 Router and Factory contracts
        //     const uniswapRouter = await hre.ethers.getContractAt("IUniswapV2Router02", uniswapRouterAddress);
        //     const uniswapFactory = await hre.ethers.getContractAt("IUniswapV2Factory", uniswapFactoryAddress);

        //     // Get the WETH address
        //     const wethAddress = await uniswapRouter.WETH();

        //     // Get the pair address and the pair contract
        //     const pairAddress = await uniswapFactory.getPair(benBKToken.target, wethAddress);
        //     const pairContract = await hre.ethers.getContractAt("IUniswapV2Pair", pairAddress);

        //     // Get the reserves and the tokens in the pair
        //     // BBK/WETH
        //     const [reserve0, reserve1,] = await pairContract.getReserves();
        //     const token0 = await pairContract.token0();
        //     const token1 = await pairContract.token1();

        //     console.log(`Reserve0: ${reserve0}`);
        //     console.log(`Reserve1: ${reserve1}`);
        //     console.log(`Token0 (BBK): ${token0}`);
        //     console.log(`Token1 (WETH): ${token1}`);

        //     // Check if the tokens in the pair are correct
        //     expect(token0).to.be.equal(benBKToken.target);
        //     expect(token1).to.be.equal(wethAddress);
        // })
    });

})