import { Sr25519Account } from '@unique-nft/sr25519';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { TKN } from './currency';
import { upgrades, ethers } from 'hardhat';
import { ContractHelpers, ContractHelpers__factory, Market__factory } from '../../typechain-types';
import SdkHelper from './SdkHelper';
import testConfig from './testConfig';
import { Wallet } from 'ethers';
import { MarketHelper } from './MarketHelper';
import { convertBigintToNumber } from './helpers';
import { TokenId } from '@unique-nft/sdk';

export default class TestHelper {
  sdk: SdkHelper;
  contractHelpers: ContractHelpers;
  donor: HardhatEthersSigner;

  private constructor(sdk: SdkHelper, donor: HardhatEthersSigner, contractHelpers: ContractHelpers) {
    this.sdk = sdk;
    this.contractHelpers = contractHelpers;
    this.donor = donor;
  }

  static async init() {
    const sdk = await SdkHelper.init();
    const donor = (await ethers.getSigners())[0];

    const donorBalance = await sdk.getBalanceOf(donor.address);
    if (donorBalance < TKN(10_000, 18)) {
      await sdk.transfer(TKN(10_000, 18), donor.address);
    }

    const contractHelpers = ContractHelpers__factory.connect(testConfig.contractHelperAddress, donor);

    return new TestHelper(sdk, donor, contractHelpers);
  }

  async deployMarket() {
    const MarketFactory = await ethers.getContractFactory('Market');
    const RoyaltyHelper = await ethers.getContractFactory('UniqueRoyaltyHelper');

    const contract = await upgrades.deployProxy(MarketFactory, [0], {
      initializer: 'initialize',
      txOverrides: {
        gasLimit: 7_000_000,
      },
    });

    await contract.waitForDeployment();
    const marketAddress = await contract.getAddress();

    const market = Market__factory.connect(marketAddress, this.donor);

    // Setting royalty helper. Only for tests! In production this lib has static address
    const royaltyHelper = await RoyaltyHelper.deploy({
      gasLimit: 7_000_000,
    });
    await royaltyHelper.waitForDeployment();
    await market.setRoyaltyHelpers(royaltyHelper.getAddress(), { gasLimit: 300000 });

    // Set self-sponsoring, and deposit 100 tokens
    await Promise.all([
      // sponsor transactions from contract itself:
      (await this.contractHelpers.selfSponsoredEnable(marketAddress, { gasLimit: 300000 })).wait(),
      // sponsor every transaction:
      (await this.contractHelpers.setSponsoringRateLimit(marketAddress, 0, { gasLimit: 300000 })).wait(),
      // set generous mode:
      (await this.contractHelpers.setSponsoringMode(marketAddress, 2, { gasLimit: 300000 })).wait(),
      // top up contract's balance for sponsoring:
      await this.sdk.transfer(TKN(1000, 18), marketAddress),
    ]);

    return MarketHelper.create(this.sdk.sdk, market);
  }

  async createFungibleCollection(decimals: number) {
    const funCollection = await this.sdk.createFungibleCollection({
      decimals,
      name: 'Wrapped USD',
      tokenPrefix: 'WUSD',
      description: 'Not a real USD',
    });

    const oneMillion = 1000_000;
    const { error } = await this.sdk.sdk.fungible.addTokens({
      amount: oneMillion,
      collectionId: funCollection.collectionId,
      recipient: this.sdk.donor.address,
    });

    if (error) {
      console.error(error);
      throw Error('Cannot mint fungible tokens');
    }

    return funCollection;
  }

  async topUpFungibleBalance(collectionId: number, amount: bigint, recipient: string) {
    // TODO use wei
    const decimals = collectionId === 0 ? 18 : (await this.sdk.sdk.fungible.getCollection({ collectionId })).decimals;
    const amountToNumber = convertBigintToNumber(amount, decimals);
    const { error } = await this.sdk.sdk.fungible.transferTokens({ collectionId, recipient, amount: amountToNumber });
    if (error) throw Error('Cannot top up fungible balance');
  }

  async getBalance(address: string, collectionId = 0) {
    return this.sdk.getBalanceOf(address, collectionId);
  }

  async createNftCollectionV2() {
    return this.sdk.createNftCollection();
  }

  async createNft(collectionId: number, owner: string) {
    return this.sdk.createNft(collectionId, { owner });
  }

  async getOwnerOf(token: TokenId) {
    return this.sdk.getOwnerOf(token);
  }

  async createSubAccounts(balances: bigint[]) {
    const wallets = balances.map((_) => Sr25519Account.fromUri(Sr25519Account.generateMnemonic()));
    await this.createAccounts(
      balances,
      wallets.map((w) => w.address),
    );

    return wallets;
  }

  async createEthAccounts(balances: bigint[]) {
    const wallets = balances.map((_) => Wallet.createRandom().connect(ethers.provider));
    await this.createAccounts(
      balances,
      wallets.map((w) => w.address),
    );

    return wallets;
  }

  private async createAccounts(balances: bigint[], addresses: string[]) {
    let { nonce } = await this.sdk.getNonce(this.sdk.donor.address!);
    const txs = [];

    for (const [i, balance] of balances.entries()) {
      if (balance !== 0n) {
        txs.push(this.sdk.transfer(balance, addresses[i], nonce));
        nonce++;
      }
    }

    return Promise.all(txs);
  }
}
