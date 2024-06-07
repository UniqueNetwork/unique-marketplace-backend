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
const INITIAL_PRICE = TKN(10, 18);
const NEW_PRICE = TKN(12, 18);
const UNQ_CURRENCY = 0;
const ERC20_CURRENCY = 1984;

before(async () => {
  helper = await TestHelper.init();
  marketplace = await helper.deployMarket();
  nftCollection = await helper.createNftCollectionV2();
  await marketplace.registerCurrency(ERC20_CURRENCY, 0);
});

for (const TEST_CASE of TEST_CASE_MODES) {
  describe(`Put on sale from ${TEST_CASE}`, () => {
    it('token owner can put NFT on sale for native currency', async () => {
      const [ethOwner] = await helper.createAccounts([INITIAL_BALANCE, INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

      // Initial owner puts nft on sale for UNQ
      await canPutOnSale(ethOwner, nft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);
    });

    it('token owner can put NFT on sale for registered ERC-20 currency', async () => {
      const [owner] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, owner.address);

      // Initial owner puts nft on sale for UNQ
      await canPutOnSale(owner, nft, INITIAL_PRICE, ERC20_CURRENCY, marketplace);
    });

    it('token owner can put on sale an NFT even if it has already been listed by himself', async () => {
      const [ethOwner] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

      // Initial owner puts nft on sale
      await canPutOnSale(ethOwner, nft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);
      // FIXME: can put up for sale again
      await canPutOnSale(ethOwner, nft, NEW_PRICE, UNQ_CURRENCY, marketplace);
    });

    it('token owner can put on sale an NFT even if it has already been listed by the previous owner', async () => {
      const [initialOwner, newOwner] = await helper.createAccounts([INITIAL_BALANCE, INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, initialOwner.address);

      // Initial owner puts nft on sale
      await canPutOnSale(initialOwner, nft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);
      // Initial owner transfers nft to New owner
      await helper.transferNft(nft, newOwner.address, initialOwner);

      // Check new owner
      expect(await helper.getOwnerOf(nft)).to.eq(newOwner.address.toLowerCase());
      // Order still exists
      const orderBefore = await marketplace.getOrder(nft);
      expect(orderBefore.seller).to.eq(initialOwner.address);

      // FIXME: new owner can put on sale
      await canPutOnSale(newOwner, nft, NEW_PRICE, UNQ_CURRENCY, marketplace);
    });

    it('token owner can put on sale nft if it was removed from black list', async () => {
      const [account] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const blackListedCollection = await helper.createNftCollectionV2();
      const blackListedNft = await helper.createNft(blackListedCollection.collectionId, account.address);

      await marketplace.addToBlackList(blackListedCollection.collectionId);
      await marketplace.removeFromBlacklist(blackListedCollection.collectionId);

      await canPutOnSale(account, blackListedNft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);
    });
  });

  describe(`[Negative] Put on sale from ${TEST_CASE}`, () => {
    it('owner cannot put NFT on sale for non-registered currency', async () => {
      const NON_REGISTERED_CURRENCY = ERC20_CURRENCY + 333;
      const [owner] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, owner.address);

      // owner cannot puts nft on sale for some random currency
      await expect(canPutOnSale(owner, nft, INITIAL_PRICE, NON_REGISTERED_CURRENCY, marketplace)).rejectedWith(
        /transaction execution reverted|InvalidArgument/,
      );
    });

    it('owner cannot put NFT on sale for zero', async () => {
      const ZERO_PRICE = 0n;
      const [ethOwner] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

      // owner cannot puts nft on sale for some random currency
      await expect(canPutOnSale(ethOwner, nft, ZERO_PRICE, UNQ_CURRENCY, marketplace)).rejectedWith(
        /transaction execution reverted|InvalidArgument/,
      );
    });

    it('owner cannot put non-approved NFT on sale', async () => {
      const [ethOwner] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

      // no approve - only put
      await expect(
        marketplace.put({
          ...nft,
          currency: UNQ_CURRENCY,
          price: INITIAL_PRICE,
          signer: ethOwner,
        }),
      ).rejectedWith(/transaction execution reverted|TokenIsNotApproved/);
    });

    it('cannot put non existent NFT on sale', async () => {
      const [ethAccount] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const nonExistentNft = {
        collectionId: nftCollection.collectionId,
        tokenId: 999999999,
      };

      // owner cannot puts nft on sale for some random currency
      await expect(canPutOnSale(ethAccount, nonExistentNft, INITIAL_PRICE, UNQ_CURRENCY, marketplace)).rejectedWith(
        /transaction execution reverted|Token not found/,
      );
    });

    it('cannot put black-listed NFT on sale', async () => {
      const [ethAccount] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const blackListedCollection = await helper.createNftCollectionV2();
      const blackListedNft = await helper.createNft(blackListedCollection.collectionId, ethAccount.address);

      await marketplace.addToBlackList(blackListedCollection.collectionId);

      await expect(canPutOnSale(ethAccount, blackListedNft, INITIAL_PRICE, UNQ_CURRENCY, marketplace)).rejectedWith(
        /transaction execution reverted|CollectionInBlacklist/,
      );
    });

    it('cannot put fungible on sale', async () => {
      const [ethAccount] = await helper.createAccounts([INITIAL_BALANCE], TEST_CASE);
      const funCollection = await helper.createFungibleCollection(6);
      await helper.topUpFungibleBalance(funCollection.collectionId, TKN(1000, 6), ethAccount.address);
      await marketplace.registerCurrency(funCollection.collectionId, 0);

      await marketplace.approveFungible(funCollection.collectionId, TKN(10, 6), ethAccount);
      await expect(
        marketplace.put({
          collectionId: funCollection.collectionId,
          tokenId: 0,
          currency: UNQ_CURRENCY,
          price: 100,
          signer: ethAccount,
        }),
      ).rejectedWith(/transaction execution reverted|CollectionNotSupportedERC721/);
    });

    it('non-owner cannot put on sale an NFT', async () => {
      const [ethOwner, ethNonOwner] = await helper.createAccounts([INITIAL_BALANCE, INITIAL_BALANCE], TEST_CASE);
      const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

      await expect(
        marketplace.put({
          ...nft,
          currency: UNQ_CURRENCY,
          price: INITIAL_PRICE,
          signer: ethNonOwner,
        }),
      ).rejectedWith(/transaction execution reverted|SellerIsNotOwner/);

      await marketplace.expectOrderZero(nft);
    });
  });
}
