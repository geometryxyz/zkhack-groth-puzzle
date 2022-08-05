import { exec as _exec } from "child_process"
import download from "download"
import fs from "fs"
import path from "path"
import logger from "js-logger"
import rimraf from "rimraf"
const { zKey } = require("snarkjs")
import { promisify } from "util"
import { config } from "./package.json"
import { parse } from 'ts-command-line-args'


logger.useDefaults()

const args = parse({
    circuit: String,
});

async function exec(command: string) {
  const { stderr, stdout } = await promisify(_exec)(command)

  if (stderr) {
    throw new Error(stderr)
  }

  logger.info(stdout)
}

async function main() {
    const { circuit } = args;
    const buildPath = path.join(config.paths.build.snark, circuit)
    const solidityVersion = config.solidity.version

    if (!fs.existsSync(buildPath)) {
        fs.mkdirSync(buildPath, { recursive: true })
    }

    if (!fs.existsSync(`${buildPath}/powersOfTau28_hez_final_14.ptau`)) {
        const url = "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau"

        await download(url, buildPath)
    }

    await exec(`circom --O0 ./circuits/${circuit}.circom --r1cs --wasm -o ${buildPath}`)

    await zKey.newZKey(
        `${buildPath}/${circuit}.r1cs`,
        `${buildPath}/powersOfTau28_hez_final_14.ptau`,
        `${buildPath}/${circuit}_0000.zkey`,
        logger
    )

    await zKey.beacon(
        `${buildPath}/${circuit}_0000.zkey`,
        `${buildPath}/${circuit}_final.zkey`,
        "Final Beacon",
        "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
        10,
        logger
    )

    let verifierCode = await zKey.exportSolidityVerifier(
        `${buildPath}/${circuit}_final.zkey`,
        { groth16: fs.readFileSync("./node_modules/snarkjs/templates/verifier_groth16.sol.ejs", "utf8") },
        logger
      )
    verifierCode = verifierCode.replace(/pragma solidity \^\d+\.\d+\.\d+/, `pragma solidity ^${solidityVersion}`)
    fs.writeFileSync(`${config.paths.contracts}/Verifier.sol`, verifierCode, "utf-8")
    

    const verificationKey = await zKey.exportVerificationKey(`${buildPath}/${circuit}_final.zkey`, logger)
    fs.writeFileSync(`${buildPath}/${circuit}_verification_key.json`, JSON.stringify(verificationKey), "utf-8")

    fs.renameSync(`${buildPath}/${circuit}_js/${circuit}.wasm`, `${buildPath}/${circuit}.wasm`)
    //remove unused files
    rimraf.sync(`${buildPath}/${circuit}_js`)
    rimraf.sync(`${buildPath}/${circuit}_0000.zkey`)
    rimraf.sync(`${buildPath}/${circuit}.r1cs`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
})
