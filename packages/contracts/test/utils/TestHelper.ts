import { Sr25519Account } from '@unique-nft/sr25519';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { TKN } from './currency';
import { upgrades, ethers } from 'hardhat';
import { ContractHelpers, ContractHelpers__factory, Market__factory } from '../../typechain-types';
import SdkHelper from "./SdkHelper";
import testConfig from './testConfig';
import { Wallet } from 'ethers';
import { MarketHelper } from './MarketHelper';

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

    const contractHelpers = ContractHelpers__factory.connect(testConfig.contractHelperAddress, donor);

    return new TestHelper(sdk, donor, contractHelpers);
  }

  async deployMarket() {
    const MarketFactory = await ethers.getContractFactory('Market');
    const contract = await upgrades.deployProxy(MarketFactory, [0], {
      initializer: 'initialize',
      txOverrides: {
        gasLimit: 7000000,
      },
    });

    await contract.waitForDeployment();
    const marketAddress = await contract.getAddress();

    const market = Market__factory.connect(marketAddress, this.donor);

    // Set self-sponsoring, and deposit 100 tokens
    await Promise.all([
      (await this.contractHelpers.selfSponsoredEnable(marketAddress, {gasLimit: 300000})).wait(),
      (await this.sdk.transfer(TKN(100), marketAddress)),
    ]);

    return new MarketHelper(this.sdk.sdk, market, await market.getAddress());
  }

  async createCollectionV2() {
    return this.sdk.createCollection();
  }

  async createNft(collectionId: number, owner: string) {
    return this.sdk.createNft(collectionId, {owner});
  }

  async createSubAccounts(balances: bigint[]) {
    const wallets = balances.map(_ => Sr25519Account.fromUri(Sr25519Account.generateMnemonic()));
    await this.createAccounts(balances, wallets.map(w => w.address));

    return wallets;
  }

  async createEthAccounts(balances: bigint[]) {
    const wallets = balances.map(_ => Wallet.createRandom().connect(ethers.provider));
    await this.createAccounts(balances, wallets.map(w => w.address));

    return wallets;
  }

  private async createAccounts(balances: bigint[], addresses: string[]) {
    let {nonce} = await this.sdk.getNonce(this.sdk.donor.address!);
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
