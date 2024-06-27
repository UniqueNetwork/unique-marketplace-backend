import { TKN } from './utils/currency';
import TestHelper from './utils/TestHelper';
import { expect } from 'chai';
import { MarketHelper } from './utils/MarketHelper';
import { TEST_CASE_MODES, TestFungibleCollection } from './utils/types';

let helper: TestHelper;
let marketplace: MarketHelper;

const INITIAL_BALANCE = TKN(10, 18);
const UNQ_CURRENCY = 0;

before(async () => {
  helper = await TestHelper.init();
  marketplace = await helper.deployMarket();
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