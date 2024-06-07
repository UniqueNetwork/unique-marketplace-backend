import { TKN } from './utils/currency';
import TestHelper from './utils/TestHelper';
import { TestFungibleCollection, TestNftCollection, TEST_CASE_MODES } from './utils/types';
import { MarketHelper } from './utils/MarketHelper';
import { canPutOnSale, canRevoke } from './utils/steps';
import { expect } from 'chai';

let helper: TestHelper;
let marketplace: MarketHelper;
let nftCollection: TestNftCollection;
let fungibleCollection: TestFungibleCollection;

before(async () => {
  helper = await TestHelper.init();
  marketplace = await helper.deployMarket();
  nftCollection = await helper.createNftCollectionV2();
  fungibleCollection = await helper.createFungibleCollection(6);
  await marketplace.registerCurrency(fungibleCollection.collectionId, 0);
});

for (const TEST_CASE of TEST_CASE_MODES) {
  describe(`Revoke from ${TEST_CASE}`, () => {
    it('token owner can revoke', async () => {
      const INITIAL_BALANCE = TKN(10, 18);
      const [seller] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);

      const nft = await helper.createNft(nftCollection.collectionId, seller.address);
      await canPutOnSale(seller, nft, TKN(200, 18), 0, marketplace);
      await marketplace.revoke({ token: nft, signer: seller });
      await marketplace.expectOrderZero(nft);
    });

    it('admin can revokeAdmin', async () => {
      const INITIAL_BALANCE = TKN(10, 18);
      const [seller] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);

      const nft = await helper.createNft(nftCollection.collectionId, seller.address);
      await canPutOnSale(seller, nft, TKN(200, 18), 0, marketplace);
      await marketplace.revokeAdmin({ token: nft });
      await marketplace.expectOrderZero(nft);
    });

    it('admin can revokeListAdmin', async () => {
      const INITIAL_BALANCE = TKN(10, 18);
      const [seller1, seller2] = await helper.createAccounts([INITIAL_BALANCE, INITIAL_BALANCE], TEST_CASE);

      const nft1 = await helper.createNft(nftCollection.collectionId, seller1.address);
      const nft2 = await helper.createNft(nftCollection.collectionId, seller2.address);
      await canPutOnSale(seller1, nft1, TKN(200, 18), 0, marketplace);
      await canPutOnSale(seller2, nft2, TKN(200, 18), 0, marketplace);

      await marketplace.revokeListAdmin(nftCollection.collectionId, [nft1.tokenId, nft2.tokenId]);

      await marketplace.expectOrderZero(nft1);
      await marketplace.expectOrderZero(nft2);
    });

    it('admin can revoke with checkApproved if allowance is zero', async () => {
      const INITIAL_BALANCE = TKN(20, 18);
      const [seller] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);

      const nft = await helper.createNft(nftCollection.collectionId, seller.address);
      await canPutOnSale(seller, nft, TKN(200, 18), 0, marketplace);
      // remove allowance
      await marketplace.removeAllowanceNFT(nft, seller);

      // checkApproved removes order
      await marketplace.checkApproved({ token: nft });
      await marketplace.expectOrderZero(nft);
    });

    it('token owner can put on sale after revoke', async () => {
      const INITIAL_BALANCE = TKN(10, 18);
      const [seller] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);

      const nft = await helper.createNft(nftCollection.collectionId, seller.address);
      await canPutOnSale(seller, nft, TKN(200, 18), 0, marketplace);
      await canRevoke(seller, nft, 1, marketplace);
      await canPutOnSale(seller, nft, TKN(300, 18), 0, marketplace);
    });
  });

  describe(`[Negative] Revoke from ${TEST_CASE}`, () => {
    it('non-owner cannot revoke', async () => {
      const INITIAL_BALANCE = TKN(10, 18);
      const [owner, nonOwner] = await helper.createAccounts([INITIAL_BALANCE, INITIAL_BALANCE], TEST_CASE);

      const nft = await helper.createNft(nftCollection.collectionId, owner.address);
      const orderBefore = await canPutOnSale(owner, nft, TKN(200, 18), 0, marketplace);

      await expect(marketplace.revoke({ token: nft, signer: nonOwner })).rejectedWith(
        /transaction execution reverted|SellerIsNotOwner/,
      );
      const orderAfter = await marketplace.getOrder(nft);
      expect(orderBefore).to.deep.eq(orderAfter);
    });
  });
}
