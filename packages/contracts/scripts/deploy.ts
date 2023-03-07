import { ethers } from 'ethers';
import * as fs from 'fs/promises';

const assembliesBasePath = './packages/contracts/assemblies';

async function getContractSource(version: number) {
  const versionDir = `${assembliesBasePath}/${version}`;

  const abiFilename = `${versionDir}/abi.json`;
  const abi = JSON.parse((await fs.readFile(abiFilename)).toString());

  const bytecodeFilename = `${versionDir}/bytecode.txt`;
  const bytecode = (await fs.readFile(bytecodeFilename)).toString();

  return {
    abi,
    bytecode,
  };
}

export async function deploy(
  version: number,
  feeValue: number,
  rpcUrl: string,
  mnemonic: string
) {
  const { abi, bytecode } = await getContractSource(version);

  const privateKey = ethers.Wallet.fromMnemonic(mnemonic).privateKey;

  const provider = ethers.getDefaultProvider(rpcUrl);

  const signer = new ethers.Wallet(privateKey, provider);

  const MarketFactory = new ethers.ContractFactory(abi, bytecode, signer);

  const market = await MarketFactory.deploy(feeValue, {
    gasLimit: 1000000,
  });

  return market.address;
}
