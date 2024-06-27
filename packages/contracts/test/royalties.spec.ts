import TestHelper from './utils/TestHelper';
import { TestFungibleCollection, TestNftCollection } from './utils/types';
import { MarketHelper } from './utils/MarketHelper';
import { TKN } from './utils/currency';
import { canPutOnSale } from './utils/steps';
import { expect } from 'chai';

let helper: TestHelper;
let marketplace: MarketHelper;
let nftCollection: TestNftCollection;
let currency1: TestFungibleCollection;
let currency2: TestFungibleCollection;

const INITIAL_BALANCE = TKN(5000, 18);
const UNQ_CURRENCY = 0;

const GENERAL_MARKET_FEE = 10n;
const CURRENCY_1_FEE = 0n;
const CURRENCY_2_FEE = 5n;


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

// TODO sdk + eth
// TODO native, erc20

describe("Market commission", () => {
  it("general fee will be credited into market\'s address if currency fee 0", async () => {
    const TOKEN_PRICE = TKN(10, 18);
    const EXPECTED_MARKET_FEE = TOKEN_PRICE / 100n * GENERAL_MARKET_FEE;
    
    const [seller, buyer] = await helper.createAccounts([INITIAL_BALANCE, INITIAL_BALANCE], 'Ethers');
    const nft = await helper.createNft(nftCollection.collectionId, seller.address);
    
    await canPutOnSale(seller, nft, TOKEN_PRICE, UNQ_CURRENCY, marketplace);

    const marketBalanceBefore = await helper.getBalance(marketplace.address);
    // Buy:
    const {fee: sponsoredFee} = await marketplace.buy({...nft, signer: buyer, price: TOKEN_PRICE});

    const marketBalanceAfter = await helper.getBalance(marketplace.address);
    const sellerBalanceAfter = await helper.getBalance(seller.address, UNQ_CURRENCY);
    const buyerBalanceAfter = await helper.getBalance(buyer.address, UNQ_CURRENCY);

    expect(marketBalanceAfter).to.eq(marketBalanceBefore - sponsoredFee + EXPECTED_MARKET_FEE);
    expect(buyerBalanceAfter).to.eq(INITIAL_BALANCE - TOKEN_PRICE);
    expect(sellerBalanceAfter).to.eq(INITIAL_BALANCE + TOKEN_PRICE - EXPECTED_MARKET_FEE);
  });

  it("if fee set for currency it will be credited into market\'s address instead of market general fee", async () => {
    const BUYER_BALANCE = TKN(100, 6);
    const SELLER_BALANCE = TKN(2, 6);
    const TOKEN_PRICE = TKN(10, 6);
    const EXPECTED_MARKET_FEE = TOKEN_PRICE / 100n * CURRENCY_2_FEE;
    const CURRENCY_WITH_FEE = currency2.collectionId;
    
    const [seller, buyer] = await helper.createAccounts([INITIAL_BALANCE, INITIAL_BALANCE], 'Ethers');
    await helper.topUpFungibleBalance(CURRENCY_WITH_FEE, BUYER_BALANCE, buyer.address);
    await helper.topUpFungibleBalance(CURRENCY_WITH_FEE, SELLER_BALANCE, seller.address);
    const nft = await helper.createNft(nftCollection.collectionId, seller.address);
    
    await canPutOnSale(seller, nft, TOKEN_PRICE, CURRENCY_WITH_FEE, marketplace);
    
    const marketBalanceBefore = await helper.getBalance(marketplace.address, CURRENCY_WITH_FEE);

    // Approve fungible and buy
    await marketplace.approveFungible(CURRENCY_WITH_FEE, TOKEN_PRICE, buyer);
    await marketplace.buy({...nft, signer: buyer, price: TOKEN_PRICE});

    const marketBalanceAfter = await helper.getBalance(marketplace.address, CURRENCY_WITH_FEE);
    const sellerBalanceAfter = await helper.getBalance(seller.address, CURRENCY_WITH_FEE);
    const buyerBalanceAfter = await helper.getBalance(buyer.address, CURRENCY_WITH_FEE);

    expect(buyerBalanceAfter).to.eq(BUYER_BALANCE - TOKEN_PRICE);
    expect(sellerBalanceAfter).to.eq(SELLER_BALANCE + TOKEN_PRICE - EXPECTED_MARKET_FEE);
    expect(marketBalanceAfter).to.eq(marketBalanceBefore + EXPECTED_MARKET_FEE);
  });
});