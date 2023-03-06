import { loadConfig } from '../../common/modules/config';
import { ethers } from 'ethers';
import * as fs from 'fs/promises';

const assembliesBasePath = './packages/contracts/assemblies';

export async function deployContract(version: number): Promise<string> {
  const versionDir = `${assembliesBasePath}/${version}`;
  const abiFilename = `${versionDir}/abi.json`;
  const bytecodeFilename = `${versionDir}/bytecode.txt`;

  const config = loadConfig();
  const provider = ethers.getDefaultProvider(config.uniqueRpcUrl);
  const signer = new ethers.Wallet(config.walletPrivateKey, provider);

  const abi = JSON.parse((await fs.readFile(abiFilename)).toString());
  const bytecode = (await fs.readFile(bytecodeFilename)).toString();

  const MarketFactory = new ethers.ContractFactory(abi, bytecode, signer);

  const market = await MarketFactory.deploy(10, {
    gasLimit: 1000000,
  });

  const { target } = await market.deployed();

  return target as string;
}
