import { TKN } from './utils/currency';
import TestHelper from './utils/TestHelper';
import { expect } from 'chai';
import { MarketHelper } from './utils/MarketHelper';
import { TEST_CASE_MODES, TestFungibleCollection } from './utils/types';

let helper: TestHelper;
let marketplace: MarketHelper;

const INITIAL_BALANCE = TKN(10, 18);
const MARKET_FEE = 12;
const UNQ_CURRENCY = 0;

before(async () => {
  helper = await TestHelper.init();
  marketplace = await helper.deployMarket();
});

describe('Admin', () => {
  it('market owner can add new admin', async () => {
    const [newAdmin] = await helper.createEthAccounts([INITIAL_BALANCE]);
    expect(await marketplace.contract.admins(newAdmin)).to.be.false;

    await marketplace.addAdmin(newAdmin.address);

    expect(await marketplace.contract.admins(newAdmin)).to.be.true;
  });

  it('market owner can remove admin', async () => {
    const [newAdmin] = await helper.createEthAccounts([INITIAL_BALANCE]);
    await marketplace.addAdmin(newAdmin.address);

    expect(await marketplace.contract.admins(newAdmin)).to.be.true;

    await marketplace.removeAdmin(newAdmin.address);
    expect(await marketplace.contract.admins(newAdmin)).to.be.false;
  });

  it('admin can add new admin', async () => {
    const [newAdmin, nonAdmin] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
    await marketplace.addAdmin(newAdmin.address);

    await marketplace.addAdmin(nonAdmin.address, newAdmin);

    expect(await marketplace.contract.admins(nonAdmin)).to.be.true;
  });

  it('admin can remove admin', async () => {
    const [newAdmin1, newAdmin2] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
    await marketplace.addAdmin(newAdmin1.address);
    await marketplace.addAdmin(newAdmin2.address);

    expect(await marketplace.contract.admins(newAdmin1)).to.be.true;
    expect(await marketplace.contract.admins(newAdmin2)).to.be.true;

    await marketplace.removeAdmin(newAdmin2.address, newAdmin1);

    expect(await marketplace.contract.admins(newAdmin2)).to.be.false;
  });

  it('market owner can add currency', async () => {
    const newCurrency = await helper.createFungibleCollection(6);

    await marketplace.registerCurrency(newCurrency.collectionId, MARKET_FEE);

    const currencyFromContract = await marketplace.contract.getCurrency(newCurrency.collectionId);

    expect(currencyFromContract.isAvailable).to.be.true;
    expect(currencyFromContract.collectionId).to.eq(newCurrency.collectionId);
    expect(currencyFromContract.fee).to.eq(MARKET_FEE);
  });

  it('market admin can add currency', async () => {
    const [newAdmin] = await helper.createEthAccounts([INITIAL_BALANCE]);
    await marketplace.addAdmin(newAdmin.address);

    const newCurrency = await helper.createFungibleCollection(6);

    await marketplace.registerCurrency(newCurrency.collectionId, MARKET_FEE, newAdmin);

    const currencyFromContract = await marketplace.contract.getCurrency(newCurrency.collectionId);

    expect(currencyFromContract.isAvailable).to.be.true;
    expect(currencyFromContract.collectionId).to.eq(newCurrency.collectionId);
    expect(currencyFromContract.fee).to.eq(MARKET_FEE);
  });

  it('market owner can remove currency', async () => {
    const newCurrency = await helper.createFungibleCollection(6);
    await marketplace.registerCurrency(newCurrency.collectionId, MARKET_FEE);

    // owner removes currency
    await marketplace.removeCurrency(newCurrency.collectionId);
    await marketplace.expectCurrencyNotRegistered(newCurrency.collectionId);
  });

  it('admin can remove currency', async () => {
    const [newAdmin] = await helper.createEthAccounts([INITIAL_BALANCE]);
    await marketplace.addAdmin(newAdmin.address);

    const newCurrency = await helper.createFungibleCollection(6);
    await marketplace.registerCurrency(newCurrency.collectionId, MARKET_FEE);

    // newAdmin removes currency
    await marketplace.removeCurrency(newCurrency.collectionId, newAdmin);
    await marketplace.expectCurrencyNotRegistered(newCurrency.collectionId);
  });
});

describe('[Negative] Admin', () => {
  it('non-admin cannot add admin', async () => {
    const [nonAdmin1, nonAdmin2] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);

    await expect(marketplace.addAdmin(nonAdmin2.address, nonAdmin1)).rejectedWith(/transaction execution reverted/);

    expect(await marketplace.contract.admins(nonAdmin2)).to.be.false;
  });

  it('non-admin cannot add currency', async () => {
    const [nonAdminEth] = await helper.createEthAccounts([INITIAL_BALANCE]);
    const newCurrency = await helper.createFungibleCollection(6);

    await expect(marketplace.registerCurrency(newCurrency.collectionId, MARKET_FEE, nonAdminEth)).rejectedWith(
      /transaction execution reverted/,
    );

    await marketplace.expectCurrencyNotRegistered(newCurrency.collectionId);
  });

  it('non-admin cannot remove currency', async () => {
    const [nonAdminEth] = await helper.createEthAccounts([INITIAL_BALANCE]);
    const newCurrency = await helper.createFungibleCollection(6);
    await marketplace.registerCurrency(newCurrency.collectionId, MARKET_FEE);

    await expect(marketplace.removeCurrency(newCurrency.collectionId, nonAdminEth)).rejectedWith(
      /transaction execution reverted/,
    );

    const currencyFromContract = await marketplace.contract.getCurrency(newCurrency.collectionId);

    expect(currencyFromContract.isAvailable).to.be.true;
    expect(currencyFromContract.collectionId).to.eq(newCurrency.collectionId);
    expect(currencyFromContract.fee).to.eq(MARKET_FEE);
  });
});

describe('Withdraw', async () => {
  let currency: TestFungibleCollection;

  before(async () => {
    currency = await helper.createFungibleCollection(6);
  });

  describe('[positive]', () => {
    for (const TEST_CASE of TEST_CASE_MODES) {
      const accountType = TEST_CASE === 'Ethers' ? 'Ethereum' : 'Substrate';

      it(`market owner can partially withdraw native currency to ${accountType} account`, async () => {
        const [recipient] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);

        const TOP_UP = TKN(100, 18);
        const WITHDRAW = TKN(90, 18);

        // Top up market's balance
        await helper.topUpFungibleBalance(UNQ_CURRENCY, TOP_UP, marketplace.address);
        const marketBalanceBefore = await helper.getBalance(marketplace.address, UNQ_CURRENCY);
        expect(marketBalanceBefore >= TOP_UP);

        // fee should be paid by marketplace due to sponsoring
        const { fee } = await marketplace.withdraw(recipient.address, UNQ_CURRENCY, WITHDRAW);

        const marketBalanceAfter = await helper.getBalance(marketplace.address, UNQ_CURRENCY);
        const recipientBalanceAfter = await helper.getBalance(recipient.address, UNQ_CURRENCY);
        expect(marketBalanceAfter).to.eq(marketBalanceBefore - WITHDRAW - fee);
        expect(recipientBalanceAfter).to.eq(INITIAL_BALANCE + WITHDRAW);
      });

      it(`market owner can withdraw ERC-20 currency to ${accountType} account`, async () => {
        const [recipient] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
        const CURRENCY = currency.collectionId;

        const TOP_UP = TKN(100, 6);
        const WITHDRAW = TKN(90, 6);

        // Top up market's balance
        await helper.topUpFungibleBalance(CURRENCY, TOP_UP, marketplace.address);
        const marketBalanceBefore = await helper.getBalance(marketplace.address, CURRENCY);
        expect(marketBalanceBefore >= TOP_UP);

        // fee should be paid by marketplace due to sponsoring
        await marketplace.withdraw(recipient.address, CURRENCY, WITHDRAW);

        const marketBalanceAfter = await helper.getBalance(marketplace.address, CURRENCY);
        const recipientBalanceAfter = await helper.getBalance(recipient.address, CURRENCY);

        expect(marketBalanceAfter).to.eq(marketBalanceBefore - WITHDRAW);
        expect(recipientBalanceAfter).to.eq(WITHDRAW);
      });
    }
  });

  describe('[negative]', async () => {
    it('admin cannot withdraw native currency', async () => {
      const [admin] = await helper.createEthAccounts([INITIAL_BALANCE]);
      await marketplace.addAdmin(admin.address);

      const [recipient] = await helper.createEthAccounts([INITIAL_BALANCE]);

      const TOP_UP = TKN(100, 18);
      const WITHDRAW = TKN(90, 18);

      // Top up market's balance
      await helper.topUpFungibleBalance(UNQ_CURRENCY, TOP_UP, marketplace.address);
      const marketBalanceBefore = await helper.getBalance(marketplace.address, UNQ_CURRENCY);
      expect(marketBalanceBefore >= TOP_UP);

      // fee should be paid by marketplace due to sponsoring
      await expect(marketplace.withdraw(recipient.address, UNQ_CURRENCY, WITHDRAW, admin)).rejectedWith(
        /transaction execution reverted/,
      );
    });

    it('admin cannot withdraw ERC-20 currency', async () => {
      const [admin] = await helper.createEthAccounts([INITIAL_BALANCE]);
      await marketplace.addAdmin(admin.address);

      const [recipient] = await helper.createEthAccounts([INITIAL_BALANCE]);
      const CURRENCY = currency.collectionId;

      const TOP_UP = TKN(100, 6);
      const WITHDRAW = TKN(90, 6);

      // Top up market's balance
      await helper.topUpFungibleBalance(CURRENCY, TOP_UP, marketplace.address);
      const marketBalanceBefore = await helper.getBalance(marketplace.address, CURRENCY);
      expect(marketBalanceBefore >= TOP_UP);

      await expect(marketplace.withdraw(recipient.address, CURRENCY, WITHDRAW, admin)).rejectedWith(
        /transaction execution reverted/,
      );
    });

    it('random account cannot withdraw native currency', async () => {
      const [random] = await helper.createEthAccounts([INITIAL_BALANCE]);

      const [recipient] = await helper.createEthAccounts([INITIAL_BALANCE]);

      const TOP_UP = TKN(100, 18);
      const WITHDRAW = TKN(90, 18);

      // Top up market's balance
      await helper.topUpFungibleBalance(UNQ_CURRENCY, TOP_UP, marketplace.address);
      const marketBalanceBefore = await helper.getBalance(marketplace.address, UNQ_CURRENCY);
      expect(marketBalanceBefore >= TOP_UP);

      // fee should be paid by marketplace due to sponsoring
      await expect(marketplace.withdraw(recipient.address, UNQ_CURRENCY, WITHDRAW, random)).rejectedWith(
        /transaction execution reverted/,
      );
    });

    it('random account cannot withdraw ERC-20 currency', async () => {
      const [random] = await helper.createEthAccounts([INITIAL_BALANCE]);

      const [recipient] = await helper.createEthAccounts([INITIAL_BALANCE]);
      const CURRENCY = currency.collectionId;

      const TOP_UP = TKN(100, 6);
      const WITHDRAW = TKN(90, 6);

      // Top up market's balance
      await helper.topUpFungibleBalance(CURRENCY, TOP_UP, marketplace.address);
      const marketBalanceBefore = await helper.getBalance(marketplace.address, CURRENCY);
      expect(marketBalanceBefore >= TOP_UP);

      await expect(marketplace.withdraw(recipient.address, CURRENCY, WITHDRAW, random)).rejectedWith(
        /transaction execution reverted/,
      );
    });
  });
});
