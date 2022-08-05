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

console.assert = (cond, msg) => {
	if( cond )	return;
	if( console.assert.useDebugger ) debugger;
	throw new Error(msg || "Assertion failed!");
};

const run = async () => {
    const { proof, publicSignals } = JSON.parse(`{"proof":{"pi_a":["7076778705842675636541778654824835671264842003792815899892788518756808417824","4871300562969249383482829591051792322271432570205055011710223197671646924652","1"],"pi_b":[["4702507968743578934061693422759564470881256571473408115314331474240229998811","16198326042603795115438219508756675682917780977814561672804657276368883889354"],["12916734195569167956837700546311420400354235424337271822709448553494046311159","20167467333119574021428597666293210644874141810710695584907560968298314755986"],["1","0"]],"pi_c":["20014664648588403789442308373435642542109961553284949305762265534102084844319","10562544426189233680286850591386198483452124187323754995599976212942563914034","1"],"protocol":"groth16","curve":"bn128"},"publicSignals":["1"]}`);
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