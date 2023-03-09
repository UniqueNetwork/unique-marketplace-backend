import { ethers } from 'ethers';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import Web3 from 'web3';

const assembliesBasePath = './packages/contracts/assemblies';

export function getContractAbi(version: number): Array<any> {
  const versionDir = `${assembliesBasePath}/${version}`;
  const abiFilename = `${versionDir}/abi.json`;
  return JSON.parse(fs.readFileSync(abiFilename).toString());
}

export async function getContractSource(version: number) {
  const versionDir = `${assembliesBasePath}/${version}`;

  const abiFilename = `${versionDir}/abi.json`;
  const abi = JSON.parse((await fsPromises.readFile(abiFilename)).toString());

  const bytecodeFilename = `${versionDir}/bytecode.txt`;
  const bytecode = (await fsPromises.readFile(bytecodeFilename)).toString();

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

  const web3 = new Web3(rpcUrl);

  const incrementer = new web3.eth.Contract(abi);

  const incrementerTx = incrementer.deploy({
    data: bytecode,
    arguments: [feeValue],
  });

  const tx = await web3.eth.accounts.signTransaction(
    {
      data: incrementerTx.encodeABI(),
      gas: await incrementerTx.estimateGas(),
    },
    privateKey
  );
  const { contractAddress } = await web3.eth.sendSignedTransaction(
    tx.rawTransaction as string
  );
  return contractAddress;

  /*
  const provider = ethers.getDefaultProvider(rpcUrl);

  const signer = new ethers.Wallet(privateKey, provider);

  const MarketFactory = new ethers.ContractFactory(abi, bytecode, signer);

  const market = await MarketFactory.deploy(feeValue, {
    gasLimit: 1000000,
  });

  console.log('market1', market.address);

  await market.deployTransaction.wait();

  console.log('market2', market.address);

  return market.address;
   */
}
