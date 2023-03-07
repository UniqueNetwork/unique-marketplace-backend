import { ethers } from 'ethers';
import * as fs from 'fs/promises';
import Web3 from 'web3';

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

export async function deployContractByEthers(
  version: number,
  uniqueRpcUrl: string,
  mnemonic: string
): Promise<string> {
  const { abi, bytecode } = await getContractSource(version);

  const privateKey = getPrivateKeyFromMnemonic(mnemonic);

  const provider = ethers.getDefaultProvider(uniqueRpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const MarketFactory = new ethers.ContractFactory(abi, bytecode, signer);

  const market = await MarketFactory.deploy(10, {
    gasLimit: 1000000,
  });

  const { target } = await market.deployed();

  return target as string;
}

function getPrivateKeyFromMnemonic(mnemonic: string): string {
  const wallet = ethers.Wallet.fromMnemonic(mnemonic);
  return wallet.privateKey;
}

export async function deployContractByWeb3(
  version: number,
  uniqueRpcUrl: string,
  mnemonic: string
): Promise<string> {
  const { abi, bytecode } = await getContractSource(version);

  const privateKey = getPrivateKeyFromMnemonic(mnemonic);

  const web3 = new Web3(uniqueRpcUrl);

  const incrementer = new web3.eth.Contract(abi);

  const incrementerTx = incrementer.deploy({
    data: bytecode,
    arguments: [20],
  });

  const tx = await web3.eth.accounts.signTransaction(
    {
      data: incrementerTx.encodeABI(),
      gas: await incrementerTx.estimateGas(),
    },
    privateKey
  );

  const result = await web3.eth.sendSignedTransaction(
    tx.rawTransaction as string
  );

  return result.contractAddress as string;
}
