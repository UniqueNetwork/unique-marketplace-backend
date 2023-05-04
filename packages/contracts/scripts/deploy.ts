import { ethers } from 'ethers';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import Web3 from 'web3';
import { KeyringProvider } from '@unique-nft/accounts/keyring';
import { Address } from '@unique-nft/utils';

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
  metamaskSeed: string,
  substrateSeed: string,
  restUrl: string,
) {
  const { abi, bytecode } = await getContractSource(version);

  const privateKey = ethers.Wallet.fromMnemonic(metamaskSeed).privateKey;

  const web3 = new Web3(rpcUrl);

  const incrementer = new web3.eth.Contract(abi);

  const incrementerTx = incrementer.deploy({
    data: bytecode,
    arguments: [feeValue, new Date().getTime()],
  });

  const tx = await web3.eth.accounts.signTransaction(
    {
      data: incrementerTx.encodeABI(),
      gas: await incrementerTx.estimateGas(),
    },
    privateKey,
  );

  const { contractAddress, blockNumber } = await web3.eth.sendSignedTransaction(tx.rawTransaction as string);
  if (!contractAddress) {
    throw Error('Failed to publish contract');
  }

  await addToAdmin(metamaskSeed, substrateSeed, rpcUrl, restUrl, contractAddress, abi);

  return {
    contractAddress,
    blockNumber,
  };

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

async function addToAdmin(
  metamaskSeed: string,
  substrateSeed: string,
  rpcUrl: string,
  restUrl: string,
  contractAddress: string,
  contractAbi: any,
) {
  const provider = new KeyringProvider({
    type: 'sr25519',
  });
  await provider.init();
  const signer = provider.addSeed(substrateSeed);
  const adminEthereumAddress = Address.mirror.substrateToEthereum(signer.address);

  const metamaskProvider = new ethers.providers.JsonRpcBatchProvider(rpcUrl);

  const ownerWallet = ethers.Wallet.fromMnemonic(metamaskSeed).connect(metamaskProvider);

  const contract = new ethers.Contract(contractAddress, contractAbi, ownerWallet);

  const tx = await contract.addAdmin(adminEthereumAddress, {
    gasLimit: 10_000_000,
  });
  await tx.wait();
}
