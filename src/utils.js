const { groth16 } = require("snarkjs");
// import { groth16 } from "snarkjs";
const fs = require("fs");
// import * as fs from "fs";
//import * as fs from "path-browserify";
// import { builder } from "./witness_calculator";
const { builder } =  require("./witness_calculator");


const genWnts = async (input, wasmFilePath) => {
  let wntsBuff;
  //window exists only in browser
  if (typeof window !== "undefined") {
    const resp = await fetch(wasmFilePath);
    wntsBuff = await resp.arrayBuffer();
  } else {
    // @ts-ignore
    wntsBuff = fs.readFileSync(wasmFilePath);
  }

  return new Promise((resolve, reject) => {
    builder(wntsBuff)
      .then(async (witnessCalculator) => {
        const buff = await witnessCalculator.calculateWTNSBin(input, 0);
        resolve(buff);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const genProof = async (
  grothInput,
  wasmFilePath,
  finalZkeyPath
) => {
  let zkeyBuff;
  const wtnsBuff = await genWnts(grothInput, wasmFilePath);
  //window exists only in browser
  if (typeof window !== "undefined") {
    const resp = await fetch(finalZkeyPath);
    zkeyBuff = await resp.arrayBuffer();
  } else {
    // @ts-ignore
    zkeyBuff = fs.readFileSync(finalZkeyPath);
  }

  const { proof, publicSignals } = await groth16.prove(
    new Uint8Array(zkeyBuff),
    wtnsBuff,
    null
  );
  return { proof, publicSignals };
};

const verifyProof = (vKey, fullProof) => {
  const { proof, publicSignals } = fullProof;
  return groth16.verify(vKey, publicSignals, proof);
};

module.exports = { genProof, verifyProof }