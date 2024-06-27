import { UniqueNFT, UniqueFungible } from '../../typechain-types';

export type TestNftCollection = {
  collectionId: number;
  contract: UniqueNFT;
};

export type TestFungibleCollection = {
  collectionId: number;
  contract: UniqueFungible;
};

export const TEST_CASE_MODES = ['SDK', 'Ethers'] as const;

export type TestCaseMode = (typeof TEST_CASE_MODES)[number];
