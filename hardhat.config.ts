import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat"
import { config as dotenvConfig } from "dotenv"
import "hardhat-gas-reporter"
import { HardhatUserConfig } from "hardhat/config"
import { NetworksUserConfig } from "hardhat/types"
import { resolve } from "path"
import "solidity-coverage"
import { config } from "./package.json"
import "./tasks/deploy-puzzle"


dotenvConfig({ path: resolve(__dirname, "./.env") })

function getNetworks(): NetworksUserConfig | undefined {
  if (process.env.INFURA_API_KEY && process.env.BACKEND_PRIVATE_KEY) {
    const infuraApiKey = process.env.INFURA_API_KEY
    const accounts = [`0x${process.env.BACKEND_PRIVATE_KEY}`]

    return {
      mainnet: {
        url: `https://mainnet.infura.io/v3/${infuraApiKey}`,
        chainId: 1,
        accounts
      },
      kovan: {
        url: `https://kovan.infura.io/v3/${infuraApiKey}`,
        chainId: 42,
        accounts
      },
      rinkeby: {
        url: `https://rinkeby.infura.io/v3/${infuraApiKey}`,
        chainId: 4,
        accounts
      },
      arbitrum: {
        url: "https://arb1.arbitrum.io/rpc",
        chainId: 42161,
        accounts
      }
    }
  }
}

const hardhatConfig: HardhatUserConfig = {
  solidity: {
    version: config.solidity.version,
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/solidity-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  paths: {
    sources: config.paths.contracts,
    tests: config.paths.tests,
    cache: config.paths.cache,
    artifacts: config.paths.build.contracts
  },
  networks: {
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true
    },
    ...getNetworks()
  },
  typechain: {
    outDir: config.paths.build.typechain,
    target: "ethers-v5"
  }, 
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY ? process.env.ETHERSCAN_API_KEY : "undefined",
      kovan: process.env.ETHERSCAN_API_KEY ? process.env.ETHERSCAN_API_KEY : "undefined",
      rinkeby: process.env.ETHERSCAN_API_KEY ? process.env.ETHERSCAN_API_KEY : "undefined",
    }
  }
}

export default hardhatConfig
