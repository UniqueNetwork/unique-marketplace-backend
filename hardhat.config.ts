import '@nomicfoundation/hardhat-toolbox';
import { HardhatUserConfig, task } from 'hardhat/config';
import { loadConfig } from './packages/contracts/scripts';
import { buildVersion } from './packages/contracts/tasks';
import testConfig from './packages/contracts/test/utils/testConfig';

const appConfig = loadConfig();

const config: HardhatUserConfig = {
  solidity: '0.8.19',
  paths: {
    sources: './packages/contracts/src',
    tests: './packages/contracts/test',
    cache: './dist/packages/contracts/cache',
    artifacts: './dist/packages/contracts/artifacts',
  },
  defaultNetwork: 'opal',
  networks: {
    hardhat: {},
    unq: {
      url: appConfig.unq.rpcUrl,
      accounts: appConfig.accounts,
    },
    opal: {
      url: appConfig.opal.rpcUrl,
      accounts: appConfig.accounts,
    },
    test: {
      url: testConfig.ethRpcUrl,
      accounts: testConfig.ethPrivateKeys,
    },
  },
  mocha: {
    timeout: 100000000,
  },
};

export default config;

task('build:version', 'Build a new contracts version').addParam('build', 'new version, example: 1.0.0').setAction(buildVersion);
