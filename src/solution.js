const { config } = require("../package.json");
const path = require("path");
const fs = require("fs");
const { genProof, verifyProof } = require("./utils.js");
const { ZqField, Scalar } = require("ffjavascript")

const F = new ZqField(Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617"));

const circuit = "circuit";
const wasmFilePath = path.join(config.paths.build.snark, circuit, `${circuit}.wasm`)
const finalZkeyPath = path.join(config.paths.build.snark, circuit, `${circuit}_final.zkey`)
const vkeyPath = path.join(config.paths.build.snark, circuit, `${circuit}_verification_key.json`)
const vKey = JSON.parse(fs.readFileSync(vkeyPath, "utf-8"))

const a = F.e("1")
const b = F.e("1")
const c = F.e("1")
const d = F.e("1")

const witness = {
    a: a.toString(),
    b: b.toString(),
    c: c.toString(),
    d: d.toString(),
};

console.assert = (cond, msg) => {
	if( cond )	return;
	if( console.assert.useDebugger ) debugger;
	throw new Error(msg || "Assertion failed!");
};

const run = async () => {
    const { proof, publicSignals } = await genProof(witness, wasmFilePath, finalZkeyPath);
    const isValid = await verifyProof(vKey, { proof, publicSignals });
    console.assert(isValid === true, "Proof is not valid");

    const new_a = BigInt("PUT_YOUR_ADDRESS_HERE");
    publicSignals[0] = new_a;

    /*
        PUT YOUR SOLUTION HERE

        Change the proof such that isValidMalleable = true and passes assertion

    */

    const isValidMalleable = await verifyProof(vKey, { proof, publicSignals });
    console.assert(isValidMalleable === true, "Malleable is not valid");

    const proofForTx = [
        proof.pi_a[0],
        proof.pi_a[1],
        proof.pi_b[0][1],
        proof.pi_b[0][0],
        proof.pi_b[1][1],
        proof.pi_b[1][0],
        proof.pi_c[0],
        proof.pi_c[1],
    ];
    
    const proofAsStr = JSON.stringify(
        proofForTx.map((x) => BigInt(x).toString(10)),
    ).split('\n').join().replaceAll('"', '');

    /********** Paste this stringified proof to `solve` method as explained in README **********/
    console.log(proofAsStr);
};

run().then(() => {
    process.exit(0);
});