import { UniqueNFT, UniqueFungible } from "../../typechain-types";

export type TestNftCollection = {
  collectionId: number,
  contract: UniqueNFT,
}

export type TestFungibleCollection = {
  collectionId: number,
  contract: UniqueFungible,
}