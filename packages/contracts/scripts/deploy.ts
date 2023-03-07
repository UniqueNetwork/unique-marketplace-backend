import { ethers } from 'ethers';
import * as fs from 'fs/promises';
import Web3 from 'web3';

const assembliesBasePath = './packages/contracts/assemblies';

async function getSource(version: number) {
  const versionDir = `${assembliesBasePath}/${version}`;
  const abiFilename = `${versionDir}/abi.json`;
  const bytecodeFilename = `${versionDir}/bytecode.txt`;

  const abi = JSON.parse((await fs.readFile(abiFilename)).toString());
  const bytecode = (await fs.readFile(bytecodeFilename)).toString();

  return {
    abi,
    bytecode,
  };
}

export async function deployContractByEthers(
  version: number,
  uniqueRpcUrl: string,
  walletPrivateKey: string
): Promise<string> {
  const { abi, bytecode } = await getSource(version);

  const provider = ethers.getDefaultProvider(uniqueRpcUrl);
  const signer = new ethers.Wallet(walletPrivateKey, provider);

  const MarketFactory = new ethers.ContractFactory(abi, bytecode, signer);

  const market = await MarketFactory.deploy(10, {
    gasLimit: 1000000,
  });

  const { target } = await market.deployed();

  return target as string;
}

export async function deployContractByWeb3(
  version: number,
  uniqueRpcUrl: string,
  walletPrivateKey: string
): Promise<string> {
  const { abi, bytecode } = await getSource(version);

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
    walletPrivateKey
  );
  const result = await web3.eth.sendSignedTransaction(
    tx.rawTransaction as string
  );
  console.log('result', result);
  return result.contractAddress as string;
}
