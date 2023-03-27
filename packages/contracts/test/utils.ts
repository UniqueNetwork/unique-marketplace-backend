import { ethers } from 'hardhat';
import { Address } from '@unique-nft/utils';
import { KeyringAccount, KeyringProvider } from '@unique-nft/accounts/keyring';
import { UniqueNFTFactory } from '@unique-nft/solidity-interfaces';
import { Sdk } from '@unique-nft/sdk';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { loadConfig } from '../scripts';
import * as fs from 'fs';

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

    const nftCollectionId = await createCollection(sdk, address, 'NFT');
    const nftTokenId = await createToken(
      sdk,
      address,
      nftCollectionId,
      account1.address
    );

    const rftCollectionId = await createCollection(sdk, address, 'ReFungible');
    const rftTokenId = await createToken(
      sdk,
      address,
      nftCollectionId,
      account1.address
    );

    const data = {
      nft: {
        collectionId: nftCollectionId,
        tokenId: nftTokenId,
      },
      rft: {
        collectionId: rftCollectionId,
        tokenId: rftTokenId,
      },
    };
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    return data;
  }
}

export async function createCollection(
  sdk: Sdk,
  address: string,
  mode: 'NFT' | 'ReFungible' = 'NFT'
): Promise<number> {
  const result = await sdk.collections.create.submitWaitResult({
    address,
    name: 'test',
    description: 'test description',
    tokenPrefix: 'TEST',
    mode,
  });
  const collectionId = result.parsed?.collectionId;
  if (!collectionId) {
    throw new Error('fail create collection');
  }
  return collectionId;
}

export async function createToken(
  sdk: Sdk,
  address: string,
  collectionId: number,
  owner: string
): Promise<number> {
  const result = await sdk.tokens.create.submitWaitResult({
    address,
    collectionId,
    owner,
  });
  const tokenId = result.parsed?.tokenId;
  if (!tokenId) {
    throw new Error('fail create token');
  }
  return tokenId;
}

export async function deploy(fee: number = 10) {
  const Market = await ethers.getContractFactory('Market');
  const market = await Market.deploy(fee);

  return market;
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

export async function getAccounts(
  sdk: Sdk,
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
