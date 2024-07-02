import '@typechain/hardhat';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import '@openzeppelin/hardhat-upgrades';
import { HardhatUserConfig, task } from 'hardhat/config';
import { loadConfig } from './scripts';
import { buildVersion } from './tasks';
import testConfig from './test/utils/testConfig';

const appConfig = loadConfig();

const config: HardhatUserConfig = {
  solidity: '0.8.20',
  paths: {
    sources: './src',
    tests: './test',
    cache: '../../dist/packages/contracts/cache',
    artifacts: '../../dist/packages/contracts/artifacts',
  },
  typechain: {
    outDir: './typechain-types',
  },
  defaultNetwork: 'test',
  networks: {
    opal: {
      url: appConfig.opal.rpcUrl,
      accounts: appConfig.accounts,
    },
    test: {
      url: testConfig.ethRpc,
      accounts: [testConfig.ethDonorSeed],
    },
  },
  mocha: {
    timeout: 100000000,
    retries: 1,
  },
};

export default config;

task('build:version', 'Build a new contracts version').addParam('build', 'new version, example: 1.0.0').setAction(buildVersion);
