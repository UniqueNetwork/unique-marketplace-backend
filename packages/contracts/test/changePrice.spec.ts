import { TKN } from './utils/currency';
import TestHelper from './utils/TestHelper';
import { expect } from 'chai';
import { TEST_CASE_MODES, TestNftCollection } from './utils/types';
import { MarketHelper } from './utils/MarketHelper';
import { canPutOnSale } from './utils/steps';

let helper: TestHelper;
let marketplace: MarketHelper;
let nftCollection: TestNftCollection;

const INITIAL_BALANCE = TKN(10, 18);
const UNQ_CURRENCY = 0;
const ERC20_CURRENCY = 1984;

before(async () => {
  helper = await TestHelper.init();
  marketplace = await helper.deployMarket();
  nftCollection = await helper.createNftCollectionV2();
  await marketplace.registerCurrency(ERC20_CURRENCY, 0);
});

for (const TEST_CASE of TEST_CASE_MODES) {
  describe(`Change price from ${TEST_CASE}`, () => {
    it('token owner can change price', async () => {
      const INITIAL_PRICE = TKN(10, 18);
      const NEW_PRICE = TKN(12, 18);

      const [ethOwner] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

      const orderBefore = await canPutOnSale(ethOwner, nft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);
      await marketplace.changePrice({ token: nft, newPrice: NEW_PRICE, currency: UNQ_CURRENCY, signer: ethOwner });
      const orderAfter = await marketplace.getOrder(nft);

      expect(orderAfter).to.deep.eq({ ...orderBefore, price: NEW_PRICE });
    });

    it('token owner can change currency if it is registered', async () => {
      const INITIAL_PRICE = TKN(10, 18);
      const NEW_PRICE = TKN(12, 6);

      const [ethSeller] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, ethSeller.address);

      const orderBefore = await canPutOnSale(ethSeller, nft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);
      await marketplace.changePrice({ token: nft, newPrice: NEW_PRICE, currency: ERC20_CURRENCY, signer: ethSeller });
      const orderAfter = await marketplace.getOrder(nft);

      expect(orderAfter).to.deep.eq({ ...orderBefore, price: NEW_PRICE, currency: ERC20_CURRENCY });
    });

    it('token owner can change currency to registered after initial currency delisted', async () => {
      const INITIAL_PRICE = TKN(10, 18);
      const CURRENCY_TO_DELIST = ERC20_CURRENCY + 1;
      const NEW_PRICE = TKN(12, 6);

      const [ethSeller] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, ethSeller.address);
      await marketplace.registerCurrency(CURRENCY_TO_DELIST, 0);

      const orderBefore = await canPutOnSale(ethSeller, nft, INITIAL_PRICE, CURRENCY_TO_DELIST, marketplace);

      // Currency delisted
      await marketplace.removeCurrency(CURRENCY_TO_DELIST);

      // Owner can change currency to registered
      await marketplace.changePrice({ token: nft, newPrice: NEW_PRICE, currency: ERC20_CURRENCY, signer: ethSeller });
      const orderAfter = await marketplace.getOrder(nft);

      expect(orderAfter).to.deep.eq({ ...orderBefore, price: NEW_PRICE, currency: ERC20_CURRENCY });
    });
  });

  describe(`[Negative] Change price from ${TEST_CASE}`, () => {
    const INITIAL_BALANCE = TKN(10, 18);
    const UNQ_CURRENCY = 0;
    const INITIAL_PRICE = TKN(10, 18);

    it('token owner cannot change currency if it is not registered', async () => {
      const ERC20_NON_REGISTERED_CURRENCY = ERC20_CURRENCY + 100;
      const NEW_PRICE = TKN(12, 6);

      const [seller] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, seller.address);

      const orderBefore = await canPutOnSale(seller, nft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);
      await expect(
        marketplace.changePrice({
          token: nft,
          newPrice: NEW_PRICE,
          currency: ERC20_NON_REGISTERED_CURRENCY,
          signer: seller,
        }),
      ).rejectedWith(/transaction execution reverted|InvalidArgument/);
      const orderAfter = await marketplace.getOrder(nft);

      expect(orderAfter).to.deep.eq(orderBefore);
    });

    it('owner cannot change price to 0', async () => {
      const NEW_PRICE = 0n;
      const [owner] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, owner.address);

      const orderBefore = await canPutOnSale(owner, nft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);

      await expect(
        marketplace.changePrice({ token: nft, newPrice: NEW_PRICE, currency: UNQ_CURRENCY, signer: owner }),
      ).rejectedWith(/transaction execution reverted|InvalidArgument/);

      const orderAfter = await marketplace.getOrder(nft);
      expect(orderAfter).deep.eq(orderBefore);
    });

    it('owner cannot change price of a delisted currency', async () => {
      const INITIAL_PRICE = TKN(10, 18);
      const CURRENCY_TO_DELIST = ERC20_CURRENCY + 333;
      const NEW_PRICE = TKN(12, 6);

      const [seller] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, seller.address);
      await marketplace.registerCurrency(CURRENCY_TO_DELIST, 0);

      const orderBefore = await canPutOnSale(seller, nft, INITIAL_PRICE, CURRENCY_TO_DELIST, marketplace);

      // Currency delisted
      await marketplace.removeCurrency(CURRENCY_TO_DELIST);

      // Owner cannot change price without changing currency
      await expect(
        marketplace.changePrice({ token: nft, newPrice: NEW_PRICE, currency: CURRENCY_TO_DELIST, signer: seller }),
      ).rejectedWith(/transaction execution reverted|InvalidArgument/);
      const orderAfter = await marketplace.getOrder(nft);

      expect(orderAfter).to.deep.eq(orderBefore);
    });

    it('non-owner cannot change price', async () => {
      const NEW_PRICE = TKN(12, 18);

      const [owner, nonOwner] = await helper.createAccounts([INITIAL_BALANCE, INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, owner.address);

      const orderBefore = await canPutOnSale(owner, nft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);
      // TODO need to check the real error, but revert matcher is not working atm
      await expect(
        marketplace.changePrice({ token: nft, newPrice: NEW_PRICE, currency: UNQ_CURRENCY, signer: nonOwner }),
      ).rejectedWith(/transaction execution reverted|SellerIsNotOwner/);

      const orderAfter = await marketplace.getOrder(nft);
      expect(orderAfter).to.deep.eq(orderBefore);
    });
  });
}
