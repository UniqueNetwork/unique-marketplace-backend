import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { TKN } from './currency';
import { upgrades, ethers } from 'hardhat';
import { ContractHelpers, ContractHelpers__factory, Market } from '../../typechain-types';
import SdkHelper from "./SdkHelper";
import testConfig from './testConfig';
import { Wallet } from 'ethers';

export default class TestHelper {
  sdk: SdkHelper;
  contractHelpers: ContractHelpers;
  donor: HardhatEthersSigner;

  private constructor(
    sdk: SdkHelper,
    donor: HardhatEthersSigner,
    contractHelpers: ContractHelpers,
  ) {
    this.sdk = sdk;
    this.contractHelpers = contractHelpers;
    this.donor = donor;
  }

  static async init() {
    const sdk = await SdkHelper.init();
    const donor = (await ethers.getSigners())[0];

    const donorBalance = await sdk.getBalanceOf(donor.address);
    if (donorBalance < TKN(10_000)) {
      await sdk.transfer(TKN(10_000), donor.address);
    };

    const contractHelpers = ContractHelpers__factory.connect(testConfig.contractHelperAddress);

    return new TestHelper(sdk, donor, contractHelpers);
  }

  async deployMarket() {
    const MarketFactory = await ethers.getContractFactory('Market');
    const market = await upgrades.deployProxy(MarketFactory, [0], {
      initializer: 'initialize',
      txOverrides: {
        gasLimit: 7000000,
      },
    }) as unknown as Market;
  
    await market.waitForDeployment();
    const marketAddress = await market.getAddress();

    // Set self-sponsoring, and deposit 100 tokens
    await Promise.all([
      (await this.contractHelpers.selfSponsoredEnable(marketAddress, {gasLimit: 300000})).wait(),
      (await this.sdk.transfer(TKN(100), marketAddress)),
    ]);

    return market;
  }

  async createCollectionV2() {
    return this.sdk.createCollection();
  }

  async createNft(collectionId: number, owner: string) {
    return this.sdk.createNft(collectionId, {owner});
  }

  async createAccount(balance: bigint) {
    const wallet = Wallet.createRandom();
    if (balance !== 0n) {
      this.sdk.transfer(balance, wallet.address);
    }
    return wallet;
  }
}
