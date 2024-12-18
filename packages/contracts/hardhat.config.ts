import '@typechain/hardhat';
import '@nomicfoundation/hardhat-ethers';
import '@openzeppelin/hardhat-upgrades';
import { HardhatUserConfig, task } from 'hardhat/config';
import { loadConfig } from './scripts';
import { buildVersion } from './tasks';

const appConfig = loadConfig();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './src',
    tests: './test',
    cache: '../../dist/packages/contracts/cache',
    artifacts: '../../dist/packages/contracts/artifacts',
  },
  typechain: {
    outDir: './typechain-types',
  },
  defaultNetwork: 'opal',
  networks: {
    hardhat: {},
    unq: {
      url: appConfig.unq.rpcUrl,
      accounts: appConfig.accounts,
      chainId: 8880,
    },
    qtz: {
      url: appConfig.qtz.rpcUrl,
      accounts: appConfig.accounts,
      chainId: 8881,
    },
    opal: {
      url: appConfig.opal.rpcUrl,
      accounts: appConfig.accounts,
      chainId: 8882,
    },
  },
  mocha: {
    timeout: 100000000,
  },
};

export default config;

task('build:version', 'Build a new contracts version').addParam('build', 'new version, example: 1.0.0').setAction(buildVersion);
