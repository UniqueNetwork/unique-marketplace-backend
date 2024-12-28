import { TKN } from './utils/currency';
import TestHelper from './utils/TestHelper';
import { expect } from 'chai';
import { TEST_CASE_MODES, TestNftCollection } from './utils/types';
import { MarketHelper } from './utils/MarketHelper';
import { canBuy, canPutOnSaleBatch } from './utils/steps';

let helper: TestHelper;
let marketplace: MarketHelper;
let nftCollection: TestNftCollection;

const INITIAL_BALANCE = TKN(10, 18);
const INITIAL_PRICE = TKN(1, 18);
const UNQ_CURRENCY = 0;
const ERC20_CURRENCY = 1984;

before(async () => {
  helper = await TestHelper.init();
  marketplace = await helper.deployMarket();
  nftCollection = await helper.createNftCollectionV2();
  await marketplace.registerCurrency(ERC20_CURRENCY, 0);
});

for (const TEST_CASE of TEST_CASE_MODES) {
  describe(`PutBatch on sale from ${TEST_CASE} and buy`, () => {
    it('token owner can put multiple NFTs on sale for native currency', async () => {
      const [owner, buyer] = await helper.createAccounts([INITIAL_BALANCE, INITIAL_BALANCE], TEST_CASE);
      // Create multiple NFTs
      const nfts = [
        await helper.createNft(nftCollection.collectionId, owner.address),
        await helper.createNft(nftCollection.collectionId, owner.address),
      ];

      // Prepare data for batch sale
      const batchData = nfts.map((nft) => ({
        token: nft,
        price: INITIAL_PRICE,
        currencyId: UNQ_CURRENCY,
        amount: 1
      }));

      // Put NFTs on sale
      await canPutOnSaleBatch(owner, batchData, marketplace);

      // Verify orders are created
      for (const nft of nfts) {
        const order = await marketplace.getOrder(nft);
        expect(order.price).to.eq(INITIAL_PRICE);
        expect(order.seller.toLowerCase()).to.eq(owner.address.toLowerCase());
      }

      //Tokens can be bought
      for (const nft of nfts) {
        await canBuy(buyer, owner, nft, INITIAL_PRICE, UNQ_CURRENCY, marketplace, helper);

        // Verify ownership
        const ownerAfterPurchase = await helper.sdk.getOwnerOf(nft);
        expect(ownerAfterPurchase.toLowerCase()).to.eq(buyer.address.toLowerCase());
      }
    });
})}
