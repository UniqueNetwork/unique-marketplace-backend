import { Sdk, Account, CreateCollectionV2ArgsDto, CreateTokenV2ArgsDto, TokenIdQuery } from '@unique-nft/sdk/full';
import { Sr25519Account } from '@unique-nft/sr25519';
import { collectionMetadata } from '../data/collectionMetadata';
import testConfig from './testConfig';
import { callSdk, getFungibleContract, getNftContract } from './helpers';
import { TestFungibleCollection, TestNftCollection } from './types';
import { ethers } from 'hardhat';
import { TKN } from './currency';
import { CreateFungibleCollectionRequest } from '@unique-nft/sdk';
import { hasSubscribers } from 'diagnostics_channel';

export default class SdkHelper {
  readonly sdk: Sdk;
  readonly donor: Account;

  private constructor(sdk: Sdk, donor: Account) {
    this.sdk = sdk;
    this.donor = donor;
  }

  static async init() {
    const account = Sr25519Account.fromUri(testConfig.substrateDonorSeed);

    const sdk = new Sdk({
      baseUrl: testConfig.sdkUrl,
      account,
    });

    const donorBalance = await callSdk(() => sdk.balance.get({ address: account.address }));
    if (BigInt(donorBalance.availableBalance.raw) < TKN(1000, 18)) {
      throw Error('substrate donor: balance low');
    }

    return new SdkHelper(sdk, account);
  }

  async getNonce(address: string) {
    return callSdk(() => this.sdk.common.getNonce({ address }));
  }

  async transfer(amount: bigint, address: string, nonce?: number) {
    const formated = parseInt(ethers.formatEther(amount));
    await callSdk(() => this.sdk.balance.transfer.submitWaitResult({ amount: formated, destination: address }, { nonce }));
  }

  async createFungibleCollection(body: Omit<CreateFungibleCollectionRequest, 'address'>): Promise<TestFungibleCollection> {
    const response = await callSdk(() => this.sdk.fungible.createCollection(body));

    const { collectionId } = await handleSdkResponse(response);

    return {
      collectionId,
      contract: await getFungibleContract(collectionId),
    };
  }

  async createNftCollection(body?: Partial<CreateCollectionV2ArgsDto>): Promise<TestNftCollection> {
    const payload = { ...collectionMetadata, ...body };
    const response = await callSdk(() => this.sdk.collection.createV2(payload));

    const { collectionId } = await handleSdkResponse(response);

    return {
      collectionId,
      contract: await getNftContract(collectionId),
    };
  }

  async sponsorCollection(collectionId: number) {
    if (!this.donor.address) throw Error('no donor');
    const donorAddress = this.donor.address;
    const setSponsorship = await callSdk(() => this.sdk.collection.setSponsorship({collectionId, newSponsor: donorAddress}))
    await handleSdkResponse(setSponsorship);
    const confirmSponsoring = await callSdk(() => this.sdk.collection.confirmSponsorship({collectionId}));
    await handleSdkResponse(confirmSponsoring);
    const setLimits = await this.sdk.collection.setLimits({collectionId, limits: {sponsorTransferTimeout: 0}})
    await handleSdkResponse(setLimits);
  }

  async createNft(collectionId: number, token?: Partial<CreateTokenV2ArgsDto>) {
    const result = await callSdk(() => this.sdk.token.createV2({ collectionId, ...token }));
    return handleSdkResponse(result);
  }

  async createMultipleNfts(collectionId: number, tokens: Omit<CreateTokenV2ArgsDto, 'address'>[]) {
    await callSdk(() => this.sdk.token.createMultiple({
      collectionId,
      tokens,
    }));
  }

  async getBalanceOf(address: string, collectionId = 0): Promise<bigint> {
    if (collectionId === 0) {
      const result = await callSdk(() => this.sdk.balance.get({ address }));
      return BigInt(result.availableBalance.raw);
    }

    const result = await callSdk(() => this.sdk.fungible.getBalance({ collectionId, address }));
    return BigInt(result.raw);
  }

  async getOwnerOf(token: TokenIdQuery) {
    const { owner } = await callSdk(() => this.sdk.token.owner(token));
    return owner;
  }
}

const handleSdkResponse = async <T>(response: { parsed?: T; error?: object }): Promise<T> => {
  if (response.error) throw Error('Error handling response');
  if (!response.parsed) throw Error('Cannot extract parsed result');

  return response.parsed as T;
};
