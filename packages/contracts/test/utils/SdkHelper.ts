import { KeyringAccount, KeyringProvider } from "@unique-nft/accounts/keyring";
import Sdk, { CreateCollectionV2ArgsDto, CreateTokenV2ArgsDto } from '@unique-nft/sdk';
import {collectionMetadata} from "../data/collectionMetadata";
import testConfig from "./testConfig";


export default class SdkHelper {
  readonly sdk: Sdk;
  readonly accounts: KeyringAccount[];

  private constructor(sdk: Sdk, accounts: KeyringAccount[]) {
    this.sdk = sdk;
    this.accounts = accounts;
  }

  static async init() {
    const accounts = await Promise.all(
      testConfig.subPrivateKeys.map(async key => await KeyringProvider.fromUri(key))
    );

    const alice = accounts[0];

    const sdk = new Sdk({
      baseUrl: testConfig.sdkUrl,
      signer: alice
    });
    return new SdkHelper(sdk, accounts);
  }

  async createCollection(body?: Partial<CreateCollectionV2ArgsDto>) {
    const payload = {...collectionMetadata, ...body};
    const response = await this.sdk.collection.createV2(payload);

    const parsed = await handleSdkResponse(response);
    return parsed.collectionId;
  }

  createNft = (collectionId: number, token?: CreateTokenV2ArgsDto) => {
    return this.sdk.token.createV2({collectionId, ...token});
  }

  async createMultipleNfts(collectionId: number, tokens: Omit<CreateTokenV2ArgsDto, 'address'>[]) {
    await this.sdk.token.createMultipleV2({
      collectionId,
      tokens,
    });
  }
}

const handleSdkResponse = async <T>(response: {parsed?: T, error: object}): Promise<T> => {
  if (response.error) throw Error('Error handling response');
  if (!response.parsed) throw Error('Cannot extract parsed result');

  return response.parsed as T;
}
