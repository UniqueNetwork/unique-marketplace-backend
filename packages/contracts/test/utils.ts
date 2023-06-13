import { ethers } from 'hardhat';
import { Address } from '@unique-nft/utils';
import { KeyringAccount, KeyringProvider } from '@unique-nft/accounts/keyring';
import { UniqueNFTFactory } from '@unique-nft/solidity-interfaces';
import { Sdk } from '@unique-nft/sdk/full';
import * as fs from 'fs';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { loadConfig } from '../scripts';
import { Market } from '../../../typechain-types';
import { ContractReceipt } from '@ethersproject/contracts/src.ts';
import { expect } from 'chai';
import { BigNumber } from 'ethers';

export async function createSdk() {
  const appConfig = loadConfig();

  const account = await getKeyringAccount();
  const sdk = new Sdk({
    baseUrl: appConfig.sdkBaseUrl,
    signer: {
      get address(): string {
        return account.getAddress();
      },
      sign(tx) {
        // @ts-ignore
        return account.sign(tx);
      },
    },
  });
  return sdk;
}

const dataPath = 'dist/packages/contracts/tests';
fs.mkdirSync(dataPath, { recursive: true });

export interface TokenData {
  collectionId: number;
  tokenId: number;
}
interface TestData {
  nft: TokenData;
  rft: TokenData;
  fungibleId: number;
}

export async function getCollectionData(sdk: Sdk): Promise<TestData> {
  const keyringAccount = await getKeyringAccount();
  const address = keyringAccount.getAddress();

  const filename = `${dataPath}/collection.json`;

  if (fs.existsSync(filename)) {
    const dataStr = fs.readFileSync(filename).toString();
    return JSON.parse(dataStr);
  } else {
    const [account1] = await ethers.getSigners();
    console.log('account1', !!account1);

    try {
      const data = {
        nft: await createNft(sdk, address, account1.address),
        rft: await createRft(sdk, address, account1.address),
        fungibleId: await createFungible(sdk, address),
      };
      fs.writeFileSync(filename, JSON.stringify(data, null, 2));
      console.log('data', data);
      return data;
    } catch (err) {
      console.log('err', err);
      throw err;
    }
  }
}

async function createNft(sdk: Sdk, address: string, owner: string): Promise<TokenData> {
  const collectionRes = await sdk.collections.create.submitWaitResult({
    address,
    name: 'test',
    description: 'test description',
    tokenPrefix: 'TEST',
  });
  const collectionId = collectionRes.parsed?.collectionId;
  if (!collectionId) {
    throw new Error('fail create collection');
  }

  const tokenRes = await sdk.tokens.create.submitWaitResult({
    address,
    collectionId,
    owner,
  });
  const tokenId = tokenRes.parsed?.tokenId;
  if (!tokenId) {
    throw new Error('fail create token');
  }

  return {
    collectionId,
    tokenId,
  };
}

async function createRft(sdk: Sdk, address: string, owner: string): Promise<TokenData> {
  const collectionRes = await sdk.refungible.createCollection.submitWaitResult({
    address,
    name: 'test',
    description: 'test description',
    tokenPrefix: 'TEST',
  });
  const collectionId = collectionRes.parsed?.collectionId;
  if (!collectionId) {
    throw new Error('fail create rft collection');
  }

  const tokenRes = await sdk.refungible.createToken.submitWaitResult({
    address,
    collectionId,
    owner,
    amount: 100,
  });
  const tokenId = tokenRes.parsed?.tokenId;
  if (!tokenId) {
    throw new Error('fail create rft token');
  }

  return {
    collectionId,
    tokenId,
  };
}

async function createFungible(sdk: Sdk, address: string): Promise<number> {
  const collectionRes = await sdk.fungible.createCollection.submitWaitResult({
    address,
    name: 'test',
    description: 'test description',
    tokenPrefix: 'TEST',
    decimals: 10,
  });
  const collectionId = collectionRes.parsed?.collectionId;
  if (!collectionId) {
    throw new Error('fail create collection');
  }
  return collectionId;
}

export async function deploy(fee: number = 10): Promise<[Market, number]> {
  const Market = await ethers.getContractFactory('Market');
  const market = (await Market.deploy(fee, Date.now())) as Market;
  const version = await market.version();
  return [market, version];
}

export async function getCollectionContract(owner: any, collectionId: number) {
  const collectionAddress = Address.collection.idToAddress(collectionId);
  const uniqueNFT = await UniqueNFTFactory(collectionAddress, owner);

  return uniqueNFT;
}

export function getKeyringAccount(): Promise<KeyringAccount> {
  const seed = process.env.SOL_SIGNER_SEED!;

  return KeyringProvider.fromMnemonic(seed);
}

export async function getAccounts(sdk: Sdk, collectionId: number, tokenId: number) {
  const [account1, account2] = await ethers.getSigners();

  const tokenOwner = await sdk.tokens.owner({
    collectionId,
    tokenId,
  });

  const isOwner1 = tokenOwner?.owner.toLowerCase() === account1.address.toLowerCase();

  const ownerAccount = account1;

  const sellAccount: SignerWithAddress = isOwner1 ? account1 : account2;

  const buyAccount: SignerWithAddress = isOwner1 ? account2 : account1;

  return { ownerAccount, sellAccount, buyAccount };
}

export function findEventObject<T>(result: ContractReceipt, name: string): T {
  const event = (result.events || []).find((event) => event.event === name);
  if (!event) {
    throw new Error(`Event ${name} not found`);
  }
  return event.args as T;
}

export function expectOrderStruct(receivedOrder: Market.OrderStruct, order: Market.OrderStruct) {
  expect(receivedOrder.id).eq(order.id);
  expect(receivedOrder.collectionId).eq(order.collectionId);
  expect(receivedOrder.tokenId).eq(order.tokenId);
  expect(receivedOrder.amount).eq(order.amount);
  expect(receivedOrder.price).eq(BigNumber.from(order.price));
  expect(receivedOrder.seller.eth).eq(order.seller.eth);
  expect(receivedOrder.seller.sub).eq(BigNumber.from(order.seller.sub));
}
