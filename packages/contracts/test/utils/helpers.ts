import { Address } from '@unique-nft/utils';
import { UniqueNFT__factory } from '../../typechain-types';

export const getNftContract = async (collectionId: number) => {
  const collectionAddress = Address.collection.idToAddress(collectionId);
  const contract = UniqueNFT__factory.connect(collectionAddress);

  return contract;
}
