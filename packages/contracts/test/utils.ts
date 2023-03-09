import { ethers } from "hardhat";
import { Address } from "@unique-nft/utils";
import { UniqueNFTFactory } from "@unique-nft/solidity-interfaces";
import { Sdk, Client } from "@unique-nft/sdk";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { network } from "hardhat";
import { loadConfig } from "../scripts/config";

export function getNetworkConfig() {
  type networks = "unq" | "opal";
  const networkName = network.name as networks;

  const appConfig = loadConfig();
  if (!appConfig[networkName]) {
    console.error(`Invalid network name: "${networkName}"`);
    process.exit(-1);
  }

  return appConfig[networkName];
}

export function createSdk() {
  const appConfig = loadConfig();

  const sdk = new Sdk({
    baseUrl: appConfig.sdkBaseUrl,
  });
  return sdk;
}

export async function deploy(fee: number = 10) {
  const Market = await ethers.getContractFactory("Market");
  const market = await Market.deploy(fee);

  return market;
}

export async function getCollectionContract(owner: any, collectionId: number) {
  const collectionAddress = Address.collection.idToAddress(collectionId);
  const uniqueNFT = await UniqueNFTFactory(collectionAddress, owner);

  return uniqueNFT;
}

export async function getAccounts(
  sdk: Client,
  collectionId: number,
  tokenId: number
) {
  const [account1, account2] = await ethers.getSigners();

  const tokenOwner = await sdk.tokens.owner({
    collectionId,
    tokenId,
  });

  const isOwner1 =
    tokenOwner?.owner.toLowerCase() === account1.address.toLowerCase();

  const ownerAccount: SignerWithAddress = isOwner1 ? account1 : account2;

  const otherAccount: SignerWithAddress = isOwner1 ? account2 : account1;

  return { ownerAccount, otherAccount };
}
