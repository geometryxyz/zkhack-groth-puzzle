import { Contract } from "ethers"
import { task, types } from "hardhat/config"

task("deploy:puzzle", "Deploy a Puzzle contract")
  .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
  .setAction(async ({ logs }, { ethers }): Promise<Contract> => {

    const uri = "https://gateway.pinata.cloud/ipfs/QmYsrePrBhoWdxJD5oDSeuviCknQcfqoggDg6LkghaTw85";
    const refundingGasPrice = BigInt("11000000000");

    const PuzzleFactory = await ethers.getContractFactory("Puzzle")
    const puzzle = await PuzzleFactory.deploy(uri, refundingGasPrice)
    await puzzle.deployed()
    logs && console.log(`Puzzle contract has been deployed to: ${puzzle.address}`)

    // put some eher at the beggining
    let provider = new ethers.providers.InfuraProvider("kovan");
    const owner = new ethers.Wallet(`0x${process.env.BACKEND_PRIVATE_KEY}`, provider);
    let tx = {
      to: puzzle.address,
      value: ethers.utils.parseEther('0.1'),
    };

    let receipt = await owner.sendTransaction(tx);
    await receipt.wait();

    logs && console.log(`Initial funds successfully sent`);
    return puzzle
  })