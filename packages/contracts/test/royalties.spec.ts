import TestHelper from './utils/TestHelper';
import { TestFungibleCollection, TestNftCollection } from './utils/types';
import { MarketHelper } from './utils/MarketHelper';
import { TKN } from './utils/currency';
import { canPutOnSale } from './utils/steps';
import { expect } from 'chai';

let helper: TestHelper;
let nftCollection: TestNftCollection;
let currency1: TestFungibleCollection;
let currency2: TestFungibleCollection;

const INITIAL_BALANCE = TKN(300, 18);
const UNQ_CURRENCY = 0;

const GENERAL_MARKET_FEE = 10n;
const CURRENCY_1_FEE = 0n;
const CURRENCY_2_FEE = 5n;

describe('Market commission', () => {
  let marketplace: MarketHelper;

  before(async () => {
    helper = await TestHelper.init();
    marketplace = await helper.deployMarket(GENERAL_MARKET_FEE);

    nftCollection = await helper.createNftCollectionV2();
    await helper.sponsorCollection(nftCollection.collectionId);

    currency1 = await helper.createFungibleCollection(6);
    currency2 = await helper.createFungibleCollection(6);

    await marketplace.registerCurrency(currency1.collectionId, CURRENCY_1_FEE);
    await marketplace.registerCurrency(currency2.collectionId, CURRENCY_2_FEE);
  });

  it("general fee will be credited into market's address if currency fee 0", async () => {
    const TOKEN_PRICE = TKN(10, 18);
    const EXPECTED_MARKET_FEE = (TOKEN_PRICE / 100n) * GENERAL_MARKET_FEE;

    const [seller, buyer] = await helper.createAccounts([INITIAL_BALANCE, INITIAL_BALANCE], 'Ethers');
    const nft = await helper.createNft(nftCollection.collectionId, seller.address);

    await canPutOnSale(seller, nft, TOKEN_PRICE, UNQ_CURRENCY, marketplace);

    const marketBalanceBefore = await helper.getBalance(marketplace.address);
    // Buy:
    const { fee: sponsoredFee } = await marketplace.buy({ ...nft, signer: buyer, price: TOKEN_PRICE });

    const marketBalanceAfter = await helper.getBalance(marketplace.address);
    const sellerBalanceAfter = await helper.getBalance(seller.address, UNQ_CURRENCY);
    const buyerBalanceAfter = await helper.getBalance(buyer.address, UNQ_CURRENCY);

    expect(marketBalanceAfter).to.eq(marketBalanceBefore - sponsoredFee + EXPECTED_MARKET_FEE);
    expect(buyerBalanceAfter).to.eq(INITIAL_BALANCE - TOKEN_PRICE);
    expect(sellerBalanceAfter).to.eq(INITIAL_BALANCE + TOKEN_PRICE - EXPECTED_MARKET_FEE);
  });

  it("if fee set for currency it will be credited into market's address instead of market general fee", async () => {
    const BUYER_BALANCE = TKN(100, 6);
    const SELLER_BALANCE = TKN(2, 6);
    const TOKEN_PRICE = TKN(10, 6);
    const EXPECTED_MARKET_FEE = (TOKEN_PRICE / 100n) * CURRENCY_2_FEE;
    const CURRENCY_WITH_FEE = currency2.collectionId;

    const [seller, buyer] = await helper.createAccounts([INITIAL_BALANCE, INITIAL_BALANCE], 'Ethers');
    await helper.topUpFungibleBalance(CURRENCY_WITH_FEE, BUYER_BALANCE, buyer.address);
    await helper.topUpFungibleBalance(CURRENCY_WITH_FEE, SELLER_BALANCE, seller.address);
    const nft = await helper.createNft(nftCollection.collectionId, seller.address);

    await canPutOnSale(seller, nft, TOKEN_PRICE, CURRENCY_WITH_FEE, marketplace);

    const marketBalanceBefore = await helper.getBalance(marketplace.address, CURRENCY_WITH_FEE);

    // Approve fungible and buy
    await marketplace.approveFungible(CURRENCY_WITH_FEE, TOKEN_PRICE, buyer);
    await marketplace.buy({ ...nft, signer: buyer, price: TOKEN_PRICE });

    const marketBalanceAfter = await helper.getBalance(marketplace.address, CURRENCY_WITH_FEE);
    const sellerBalanceAfter = await helper.getBalance(seller.address, CURRENCY_WITH_FEE);
    const buyerBalanceAfter = await helper.getBalance(buyer.address, CURRENCY_WITH_FEE);

    expect(buyerBalanceAfter).to.eq(BUYER_BALANCE - TOKEN_PRICE);
    expect(sellerBalanceAfter).to.eq(SELLER_BALANCE + TOKEN_PRICE - EXPECTED_MARKET_FEE);
    expect(marketBalanceAfter).to.eq(marketBalanceBefore + EXPECTED_MARKET_FEE);
  });

  describe('NFT royalties', () => {
    let marketplaceWithoutFee: MarketHelper;

    before(async () => {
      marketplaceWithoutFee = await helper.deployMarket(0);
      await marketplaceWithoutFee.registerCurrency(currency1.collectionId, 0);
    });

    it('will be paid in native currency', async () => {
      const NATIVE_CURRENCY = 0;
      const TOKEN_PRICE = TKN(100, 18);
      const ROYALTY_PERCENT = 10;
      const EXPECTED_ROYALTY = (TOKEN_PRICE / 100n) * BigInt(ROYALTY_PERCENT);

      const [seller, buyer, royaltyRecipient] = await helper.createAccounts(
        [INITIAL_BALANCE, INITIAL_BALANCE, INITIAL_BALANCE],
        'Ethers',
      );

      const nftWithRoyalties = await helper.createNft(nftCollection.collectionId, seller.address, [
        { address: royaltyRecipient.address, percent: ROYALTY_PERCENT },
      ]);
      await canPutOnSale(seller, nftWithRoyalties, TOKEN_PRICE, NATIVE_CURRENCY, marketplaceWithoutFee);

      await marketplaceWithoutFee.buy({ ...nftWithRoyalties, signer: buyer, price: TOKEN_PRICE });

      const sellerBalanceAfter = await helper.getBalance(seller.address, NATIVE_CURRENCY);
      const buyerBalanceAfter = await helper.getBalance(buyer.address, NATIVE_CURRENCY);
      const royaltyRecipientBalanceAfter = await helper.getBalance(royaltyRecipient.address, NATIVE_CURRENCY);

      expect(buyerBalanceAfter).to.eq(INITIAL_BALANCE - TOKEN_PRICE);
      expect(sellerBalanceAfter).to.eq(INITIAL_BALANCE + TOKEN_PRICE - EXPECTED_ROYALTY);
      expect(royaltyRecipientBalanceAfter).to.eq(INITIAL_BALANCE + EXPECTED_ROYALTY);
    });

    it('will be paid in fungible currency', async () => {
      const CURRENCY = currency1.collectionId;
      const CURRENCY_BALANCE = TKN(300, 6);
      const TOKEN_PRICE = TKN(100, 6);
      const ROYALTY_PERCENT = 10;
      const EXPECTED_ROYALTY = (TOKEN_PRICE / 100n) * BigInt(ROYALTY_PERCENT);

      const [seller, buyer, royaltyReceiver] = await helper.createAccounts(
        [INITIAL_BALANCE, INITIAL_BALANCE, INITIAL_BALANCE],
        'Ethers',
      );

      await helper.topUpFungibleBalance(CURRENCY, CURRENCY_BALANCE, buyer.address);
      await helper.topUpFungibleBalance(CURRENCY, CURRENCY_BALANCE, seller.address);
      await helper.topUpFungibleBalance(CURRENCY, CURRENCY_BALANCE, royaltyReceiver.address);

      const nftWithRoyalties = await helper.createNft(nftCollection.collectionId, seller.address, [
        { address: royaltyReceiver.address, percent: ROYALTY_PERCENT },
      ]);
      await canPutOnSale(seller, nftWithRoyalties, TOKEN_PRICE, CURRENCY, marketplaceWithoutFee);

      await marketplaceWithoutFee.approveFungible(CURRENCY, TOKEN_PRICE, buyer);
      await marketplaceWithoutFee.buy({ ...nftWithRoyalties, signer: buyer, price: TOKEN_PRICE });

      const sellerBalanceAfter = await helper.getBalance(seller.address, CURRENCY);
      const buyerBalanceAfter = await helper.getBalance(buyer.address, CURRENCY);
      const royaltyRecipientBalanceAfter = await helper.getBalance(royaltyReceiver.address, CURRENCY);

      expect(buyerBalanceAfter).to.eq(CURRENCY_BALANCE - TOKEN_PRICE);
      expect(sellerBalanceAfter).to.eq(CURRENCY_BALANCE + TOKEN_PRICE - EXPECTED_ROYALTY);
      expect(royaltyRecipientBalanceAfter).to.eq(CURRENCY_BALANCE + EXPECTED_ROYALTY);
    });
  });

  describe('Market has fee and NFT has royalty', async () => {
    it('market fee decreases base for royalty fee', async () => {
      const TOKEN_PRICE = TKN(100, 18);
      const MARKET_FEE_PERCENT = 10;
      const ROYALTY_PERCENT = 10;
      const EXPECTED_MARKET_FEE = (TOKEN_PRICE / 100n) * BigInt(MARKET_FEE_PERCENT);
      const EXPECTED_ROYALTY_FEE = ((TOKEN_PRICE - EXPECTED_MARKET_FEE) / 100n) * BigInt(ROYALTY_PERCENT);

      const marketWithRoyalties = await helper.deployMarket(MARKET_FEE_PERCENT);

      const [seller, buyer, royaltyReceiver] = await helper.createAccounts(
        [INITIAL_BALANCE, INITIAL_BALANCE, INITIAL_BALANCE],
        'Ethers',
      );

      const nftWithRoyalties = await helper.createNft(nftCollection.collectionId, seller.address, [
        { address: royaltyReceiver.address, percent: ROYALTY_PERCENT },
      ]);
      await canPutOnSale(seller, nftWithRoyalties, TOKEN_PRICE, UNQ_CURRENCY, marketWithRoyalties);

      const marketBalanceBefore = await helper.getBalance(marketWithRoyalties.address);
      // Buy:
      const { fee: sponsoredFee } = await marketWithRoyalties.buy({ ...nftWithRoyalties, signer: buyer, price: TOKEN_PRICE });

      const marketBalanceAfter = await helper.getBalance(marketWithRoyalties.address);
      const sellerBalanceAfter = await helper.getBalance(seller.address, UNQ_CURRENCY);
      const buyerBalanceAfter = await helper.getBalance(buyer.address, UNQ_CURRENCY);
      const royaltyReceiverBalanceAfter = await helper.getBalance(royaltyReceiver.address, UNQ_CURRENCY);

      expect(marketBalanceAfter).to.eq(marketBalanceBefore - sponsoredFee + EXPECTED_MARKET_FEE);
      expect(buyerBalanceAfter).to.eq(INITIAL_BALANCE - TOKEN_PRICE);
      expect(sellerBalanceAfter).to.eq(INITIAL_BALANCE + TOKEN_PRICE - EXPECTED_MARKET_FEE - EXPECTED_ROYALTY_FEE);
      expect(royaltyReceiverBalanceAfter).to.eq(INITIAL_BALANCE + EXPECTED_ROYALTY_FEE);
    });
  });
});
