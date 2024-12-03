import { Address } from '@unique-nft/utils';
import { UniqueFungible__factory, UniqueNFT__factory } from '../../typechain-types';
import { CrossAddress } from './MarketHelper';
import { isAxiosError } from 'axios';

export const getNftContract = async (collectionId: number) => {
  const collectionAddress = Address.collection.idToAddress(collectionId);
  const contract = UniqueNFT__factory.connect(collectionAddress);

  return contract;
};

export const getFungibleContract = async (collectionId: number) => {
  const collectionAddress = Address.collection.idToAddress(collectionId);
  const contract = UniqueFungible__factory.connect(collectionAddress);

  return contract;
};

export const convertBigintToNumber = (value: bigint, decimals: number) => {
  let valueStr = value.toString();

  // If the number of decimals is greater than the length of the string, pad with zeros
  while (valueStr.length <= decimals) {
    valueStr = '0' + valueStr;
  }

  // Insert the decimal point at the correct position
  const integerPart = valueStr.slice(0, -decimals) || '0';
  const decimalPart = valueStr.slice(-decimals);

  // Combine the integer and decimal parts
  return Number(`${integerPart}.${decimalPart}`);
};

export const crossAddressFromAddress = (address: string): CrossAddress => {
  return address.startsWith('0x')
    ? { eth: address, sub: 0n }
    : { eth: '0x0000000000000000000000000000000000000000', sub: BigInt(Address.extract.substratePublicKey(address)) };
};

/**
 * Call SDK and retry on ECONNRESET with optional retry limit and backoff
 * @param sdkCall The SDK call to be executed
 * @param maxRetries Maximum retry attempts (default: 3)
 * @returns The result of the SDK call
 */
export const callSdk = async <T>(sdkCall: (...args: unknown[]) => Promise<T>, maxRetries = 3): Promise<T> => {
  let retry = 0;

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  while (retry <= maxRetries) {
    try {
      const result = await sdkCall();
      return result; // Return if successful
    } catch (error) {
      console.error('Error encountered:', error);

      if (isAxiosError(error) && error.code === 'ECONNRESET') {
        retry++;
        console.log(`ECONNRESET retry ${retry}/${maxRetries}`);
        if (retry <= maxRetries) {
          await delay(100 * retry); // Optional backoff
          continue; // Retry
        }
      }
      throw error; // Rethrow non-ECONNRESET errors or after max retries
    }
  }

  throw new Error('Maximum retry attempts exceeded');
};
