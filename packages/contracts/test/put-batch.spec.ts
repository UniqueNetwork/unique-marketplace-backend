import { TKN } from './utils/currency';
import TestHelper from './utils/TestHelper';
import { expect } from 'chai';
import { TEST_CASE_MODES, TestNftCollection } from './utils/types';
import { MarketHelper } from './utils/MarketHelper';
import { canPutOnSaleBatch } from './utils/steps';

let helper: TestHelper;
let marketplace: MarketHelper;
let nftCollection: TestNftCollection;

const INITIAL_BALANCE = TKN(10, 18);
const INITIAL_PRICE = TKN(10, 18);
const UNQ_CURRENCY = 0;
const ERC20_CURRENCY = 1984;

before(async () => {
  helper = await TestHelper.init();
  marketplace = await helper.deployMarket();
  nftCollection = await helper.createNftCollectionV2();
  await marketplace.registerCurrency(ERC20_CURRENCY, 0);
});

for (const TEST_CASE of TEST_CASE_MODES) {
  describe(`PutBatch on sale from ${TEST_CASE}`, () => {
    it('token owner can put multiple NFTs on sale for native currency', async () => {
      const [owner] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);

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
    });
})}
