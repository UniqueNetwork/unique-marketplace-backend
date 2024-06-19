import hre from 'hardhat';
import Sdk, { Account, CreateCollectionV2ArgsDto, CreateTokenV2ArgsDto, TokenIdQuery } from '@unique-nft/sdk';
import { Sr25519Account } from '@unique-nft/sr25519';
import { collectionMetadata } from "../data/collectionMetadata";
import testConfig from "./testConfig";
import { getNftContract } from './helpers';


export default class SdkHelper {
  readonly sdk: Sdk;
  readonly accounts: Account[];

  private constructor(sdk: Sdk, accounts: Account[]) {
    this.sdk = sdk;
    this.accounts = accounts;
  }

  static async init() {
    const accounts = await Promise.all(
      testConfig.subPrivateKeys.map(key => Sr25519Account.fromUri(key))
    );

    const sdk = new Sdk({
      baseUrl: testConfig.sdkUrl,
      account: accounts[0],
    });

    return new SdkHelper(sdk, accounts);
  }

  async createCollection(body?: Partial<CreateCollectionV2ArgsDto>) {
    const payload = {...collectionMetadata, ...body};
    const response = await this.sdk.collection.createV2(payload);

    const {collectionId} = await handleSdkResponse(response);

    return {
      collectionId,
      contract: await getNftContract(collectionId),
    }
  }

  async createNft(collectionId: number, token?: Partial<CreateTokenV2ArgsDto>) {
    const result = await this.sdk.token.createV2({collectionId, ...token});
    return handleSdkResponse(result);
  }

  async createMultipleNfts(collectionId: number, tokens: Omit<CreateTokenV2ArgsDto, 'address'>[]) {
    // TODO use V2
    await this.sdk.token.createMultiple({
      collectionId,
      tokens,
    });
  }

  async getBalanceOf(address: string) {
    const result = await this.sdk.balance.get({address});

    return hre.ethers.BigNumber.from(result.availableBalance.raw);
  }

  async getOwnerOf(token: TokenIdQuery) {
    const {owner} = await this.sdk.token.owner(token);
    return owner;
  }
}

const handleSdkResponse = async <T>(response: {parsed?: T, error?: object}): Promise<T> => {
  if (response.error) throw Error('Error handling response');
  if (!response.parsed) throw Error('Cannot extract parsed result');

  return response.parsed as T;
}
