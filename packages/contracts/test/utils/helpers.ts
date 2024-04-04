import { Address } from '@unique-nft/utils';
import hre from 'hardhat';
import uniqueNftAbi from '../abi/UniqueNFT.json';
import { UniqueNFT } from '@unique-nft/solidity-interfaces';

export const getNftContract = async (collectionId: number) => {
  const collectionAddress = Address.collection.idToAddress(collectionId);
  const contract = await hre.ethers.getContractAt(uniqueNftAbi, collectionAddress);

  return contract as UniqueNFT;
}
