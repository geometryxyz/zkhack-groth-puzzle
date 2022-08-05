import { Contract } from "ethers"
import { task, types } from "hardhat/config"

task("deploy:puzzle", "Deploy a Puzzle contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs }, hre): Promise<Contract> => {

    const ethers = hre.ethers;
    const uri = "ipfs://QmNqAuUbFWUoQoyTWmzj1DGEEGnwgsQDZiMQLjtBpTp356";
    const refundingGasPrice = BigInt("100000000000");

    const PuzzleFactory = await ethers.getContractFactory("Puzzle")
    const puzzle = await PuzzleFactory.deploy(uri, refundingGasPrice)
    await puzzle.deployed()
    logs && console.log(`Puzzle contract has been deployed to: ${puzzle.address}`)

    // put some eher at the beggining
    let provider = new ethers.providers.InfuraProvider("mainnet");
    const owner = new ethers.Wallet(`0x${process.env.BACKEND_PRIVATE_KEY}`, provider);
    let tx = {
      to: puzzle.address,
      value: ethers.utils.parseEther('0.2'),
    };

    let receipt = await owner.sendTransaction(tx);
    await receipt.wait();

    logs && console.log(`Initial funds successfully sent`);

    await hre.tenderly.persistArtifacts({
	name: "Puzzle",
	address: puzzle.address,
    })
    return puzzle
  })
