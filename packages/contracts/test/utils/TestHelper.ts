import { Sr25519Account } from '@unique-nft/sr25519';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { TKN } from './currency';
import { upgrades, ethers } from 'hardhat';
import { ContractHelpers, ContractHelpers__factory, Market__factory, TestUpgradedMarket__factory } from '../../typechain-types';
import SdkHelper from './SdkHelper';
import testConfig from './testConfig';
import { Wallet, HDNodeWallet, ContractFactory, BaseContract } from 'ethers';
import { MarketAccount, MarketHelper } from './MarketHelper';
import { convertBigintToNumber, getNftContract, callSdk } from './helpers';
import { Royalty, TokenId } from '@unique-nft/sdk';
import { TestCaseMode } from './types';

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

  async deployMarket(marketFee?: bigint | number) {
    const MarketFactory = await ethers.getContractFactory('Market');
    const RoyaltyHelper = await ethers.getContractFactory('UniqueRoyaltyHelper');

    const fee = marketFee ?? 0;

    const contract = await upgrades.deployProxy(MarketFactory, [fee], {
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

  async upgradeMarket(marketAddress: string) {
    const marketFactory = await ethers.getContractFactory('TestUpgradedMarket');
    const contract = await upgrades.upgradeProxy(marketAddress, marketFactory);
    await contract.waitForDeployment();

    return TestUpgradedMarket__factory.connect(marketAddress, this.donor);
  }

  async createFungibleCollection(decimals: number) {
    const funCollection = await this.sdk.createFungibleCollection({
      decimals,
      name: 'Wrapped USD',
      tokenPrefix: 'WUSD',
      description: 'Not a real USD',
    });

    const oneMillion = 1000_000;
    const { error } = await callSdk(() =>
      this.sdk.sdk.fungible.addTokens({
        amount: oneMillion,
        collectionId: funCollection.collectionId,
        recipient: this.sdk.donor.address,
      }),
    );

    if (error) {
      console.error(error);
      throw Error('Cannot mint fungible tokens');
    }

    return funCollection;
  }

  async topUpFungibleBalance(collectionId: number, amount: bigint, recipient: string) {
    // for native token
    if (collectionId === 0) {
      const { error } = await callSdk(() =>
        this.sdk.sdk.balance.transfer({
          amount: convertBigintToNumber(amount, 18),
          destination: recipient,
        }),
      );
      if (error) throw Error('Cannot top up native balance');
    } else {
      // for fungible
      const { decimals } = await callSdk(() => this.sdk.sdk.fungible.getCollection({ collectionId }));
      const amountToNumber = convertBigintToNumber(amount, decimals);
      const { error } = await callSdk(() =>
        this.sdk.sdk.fungible.transferTokens({ collectionId, recipient, amount: amountToNumber }),
      );
      if (error) throw Error('Cannot top up fungible balance');
    }
  }

  async getBalance(address: string, collectionId = 0) {
    return this.sdk.getBalanceOf(address, collectionId);
  }

  async createNftCollectionV2(royalties?: Royalty[]) {
    return this.sdk.createNftCollection({
      royalties,
    });
  }

  async createNft(collectionId: number, owner: string, royalties?: Royalty[]) {
    return this.sdk.createNft(collectionId, { owner, royalties });
  }

  async sponsorCollection(collectionId: number) {
    return this.sdk.sponsorCollection(collectionId);
  }

  async transferNft(token: TokenId, to: string, signer: MarketAccount) {
    if (signer instanceof HDNodeWallet) {
      const nftContract = await getNftContract(token.collectionId);
      return nftContract
        .connect(signer)
        .transfer(to, token.tokenId, { gasLimit: 300_000 })
        .then((tx) => tx.wait());
    }
    return callSdk(() => this.sdk.sdk.token.transfer({ ...token, to, address: signer.address }, { signer: signer.signer }));
  }

  async getOwnerOf(token: TokenId) {
    return (await this.sdk.getOwnerOf(token)).toLowerCase();
  }

  async createAccounts(balances: bigint[], mode: TestCaseMode) {
    if (mode === 'SDK') return this.createSubAccounts(balances);
    return this.createEthAccounts(balances);
  }

  async createSubAccounts(balances: bigint[]) {
    const wallets = balances.map((_) => Sr25519Account.fromUri(Sr25519Account.generateMnemonic()));
    await this._createAccounts(
      balances,
      wallets.map((w) => w.address),
    );

    return wallets;
  }

  async createEthAccounts(balances: bigint[]) {
    const wallets = balances.map((_) => Wallet.createRandom().connect(ethers.provider));
    await this._createAccounts(
      balances,
      wallets.map((w) => w.address),
    );

    return wallets;
  }

  private async _createAccounts(balances: bigint[], addresses: string[]) {
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
