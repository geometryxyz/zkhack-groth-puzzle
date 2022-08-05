import { ethers, waffle } from "hardhat";
import { solidity } from "ethereum-waffle";
import chai from "chai";
import { Puzzle } from "../build/typechain/Puzzle";
import path from "path";
import fs from "fs";
import { config } from "../package.json";
import { genProof, verifyProof } from "../src/utils";

chai.use(solidity);
const { expect } = chai;

const packToSolidityProof = (proof: any) => {
  return [
    proof.pi_a[0],
    proof.pi_a[1],
    proof.pi_b[0][1],
    proof.pi_b[0][0],
    proof.pi_b[1][1],
    proof.pi_b[1][0],
    proof.pi_c[0],
    proof.pi_c[1],
  ];
};

const circuit = "circuit";
const wasmFilePath = path.join(
  config.paths.build.snark,
  circuit,
  `${circuit}.wasm`
);
const finalZkeyPath = path.join(
  config.paths.build.snark,
  circuit,
  `${circuit}_final.zkey`
);
const vkeyPath = path.join(
  config.paths.build.snark,
  circuit,
  `${circuit}_verification_key.json`
);
const vKey = JSON.parse(fs.readFileSync(vkeyPath, "utf-8"));

// const uri = "https://picsum.photos/id/0/200/300";
const uri = "https://gateway.pinata.cloud/ipfs/QmYsrePrBhoWdxJD5oDSeuviCknQcfqoggDg6LkghaTw85";
const refundingGasPrice = BigInt("11000000000");

const witness = {
  a: BigInt(1),
  b: BigInt(1),
  c: BigInt(1),
  d: BigInt(1),
};

describe("Puzzle", async () => {
  let puzzle: Puzzle;
  let owner: any;

  beforeEach(async () => {
    const PuzzleFactory = await ethers.getContractFactory("Puzzle");
    puzzle = (await PuzzleFactory.deploy(uri, refundingGasPrice)) as Puzzle;
    await puzzle.deployed();

    [owner] = await ethers.getSigners();

    let tx = {
      to: puzzle.address,
      value: ethers.utils.parseEther('0.1'),
    };

    let receipt = await owner.sendTransaction(tx);
    await receipt.wait();
  });

  it("should pause puzzle", async () => {
    let isPaused: boolean;
    isPaused = await puzzle.paused();
    expect(isPaused).to.be.false;
    const tx1 = await puzzle.pause();
    await tx1.wait();
    isPaused = await puzzle.paused();
    expect(isPaused).to.be.true;
    const tx2 = await puzzle.unpause();
    await tx2.wait();
    isPaused = await puzzle.paused();
    expect(isPaused).to.be.false;
  });

  let solidityProof: any;

  it("should generate a proof", async () => {
    const fullProof = await genProof(witness, wasmFilePath, finalZkeyPath);
    const res = await verifyProof(vKey, fullProof);
    expect(res).to.be.true;

    solidityProof = packToSolidityProof(fullProof.proof);
  });

  it("should fail to verify while paused", async () => {
    const pauseTx = await puzzle.pause();
    await pauseTx.wait();

    const solveTx = puzzle.solve(solidityProof);

    await expect(solveTx).to.be.revertedWith("Pausable: paused");
  });

  it("should fail with wrong proof", async () => {
    const fullProof = await genProof(witness, wasmFilePath, finalZkeyPath);
    const res = await verifyProof(vKey, fullProof);
    expect(res).to.be.true;

    const solidityProof = packToSolidityProof(fullProof.proof);
    const solveTx = puzzle.solve(solidityProof);

    await expect(solveTx).to.be.revertedWith("Puzzle: Invalid proof");
  });

  it("should assign the base URI", async () => {
    const uri = "abc";
    const tx = await puzzle.setBaseURI(uri);
    await tx.wait()

    const uri1 = await puzzle.tokenURI(1);
    expect(uri1).to.eq(uri);
  });

  it("burning the admin key should make the contract trustless", async () => {
      const burnAddress = '0x000000000000000000000000000000000000dead'
      const tx = await puzzle.transferOwnership(burnAddress);
      await tx.wait();

      let tx2 = puzzle.pause();
      await expect(tx2).to.be.revertedWith(
          'Ownable: caller is not the owner'
      );

      let tx3 = puzzle.setBaseURI('bad');
      await expect(tx3).to.be.revertedWith(
          'Ownable: caller is not the owner'
      );
  })

  it("set different gasprice", async () => {
    const tx = await puzzle.setRefundingGasPrice(BigInt("11111111000"));
    await tx.wait();
    const newRefundingGasPrice = await puzzle.refundingGasPrice();
    expect(newRefundingGasPrice).to.be.equal(BigInt("11111111000"));
  });

  it("withdraws money from contract when puzzle is finished", async () => {
    const provider = waffle.provider;
    const balanceBeforeWithdrawal = await provider.getBalance(puzzle.address);
    // before deploying there should be 0.1 eth in the contract
    expect(balanceBeforeWithdrawal).to.be.equal(ethers.utils.parseEther('0.1'));

    const tx = await puzzle.withdraw();
    await tx.wait();

    const newBalance = await provider.getBalance(puzzle.address); 
    expect(newBalance).to.be.equal(BigInt("0"));
  });
});
