import { TKN } from './utils/currency';
import TestHelper from './utils/TestHelper';
import { expect } from 'chai';
import { TestFungibleCollection, TestNftCollection } from './utils/types';
import { MarketAccount, MarketHelper } from './utils/MarketHelper';

let helper: TestHelper;
let marketplace: MarketHelper;
let nftCollection: TestNftCollection;
let fungibleCollection: TestFungibleCollection;

describe('Can put for sale and buy', () => {
  before(async () => {
    helper = await TestHelper.init();
    marketplace = await helper.deployMarket();
    nftCollection = await helper.createNftCollectionV2();
    fungibleCollection = await helper.createFungibleCollection(6);
    await marketplace.registerCurrency(fungibleCollection.collectionId, 0);
  });

  describe("for native token", () => {
    const PRICE = TKN(5, 18);
    const INITIAL_BALANCE = TKN(50, 18);
  
    it('using ethereum', async () => {
      const [ethSeller, ethBuyer] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
      await canPutOnSaleAndBuy(ethSeller, ethBuyer, PRICE, 0);
    });
  
    it('using sdk', async () => {
      const [seller, buyer] = await helper.createSubAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
      await canPutOnSaleAndBuy(seller, buyer, PRICE, 0);
    });
  });

  describe("for erc20 token", () => {
    const NATIVE_BALANCE = TKN(10, 18);
    const PRICE = TKN(5, 6);
    const ERC20_BALANCE = TKN(50, 6);

    it('using ethereum', async () => {
      const [ethSeller, ethBuyer] = await helper.createEthAccounts([NATIVE_BALANCE, NATIVE_BALANCE]);

      // Top up seller ERC-20 balance
      await helper.topUpFungibleBalance(fungibleCollection.collectionId, ERC20_BALANCE, ethBuyer.address);
      await marketplace.approveFungible(fungibleCollection.collectionId, PRICE, ethBuyer);

      await canPutOnSaleAndBuy(ethSeller, ethBuyer, PRICE, fungibleCollection.collectionId);
    });
  
    it('using sdk', async () => {
      const [subSeller, subBuyer] = await helper.createSubAccounts([NATIVE_BALANCE, NATIVE_BALANCE]);

      // Top up seller ERC-20 balance
      await helper.topUpFungibleBalance(fungibleCollection.collectionId, ERC20_BALANCE, subBuyer.address);
      await marketplace.approveFungible(fungibleCollection.collectionId, PRICE, subBuyer);
      
      await canPutOnSaleAndBuy(subSeller, subBuyer, PRICE, fungibleCollection.collectionId);
    });
  });
});

async function canPutOnSaleAndBuy(seller: MarketAccount, buyer: MarketAccount, price: bigint, currencyId: number) {
  if (!seller.address || !buyer.address) throw Error('Cannot get account address');
  const SELLER_INITIAL_BALANCE = await helper.getBalance(seller.address, currencyId);
  const BUYER_INITIAL_BALANCE = await helper.getBalance(buyer.address, currencyId);
  // 0. arrange
  // const [seller, buyer] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
  const token = await helper.createNft(
    nftCollection.collectionId,
    seller.address,
  );

  // 1. approve
  const approveTx = await marketplace.approveNFT(token, seller);

  // 2. put
  const putTx = await marketplace.put({
    collectionId: token.collectionId,
    tokenId: token.tokenId,
    currency: currencyId,
    price: price,
    signer: seller,
  });

  // 3. Check the order
  const order = await marketplace.getOrder(token);
  expect(order.id).to.eq(marketplace.getLastOrderId());
  expect(order.collectionId).to.eq(BigInt(nftCollection.collectionId));
  expect(order.tokenId).to.eq(BigInt(token.tokenId));
  expect(order.price).to.eq(price);
  expect(order.seller).to.deep.eq(seller.address);

  // 4. buy
  const buyTx = await marketplace.buy({
    collectionId: token.collectionId,
    tokenId: token.tokenId,
    price: price,
    signer: buyer
  });

  // 5. Check order deleted
  await marketplace.expectOrderZero(token);

  // 6. Check token owner: buyer
  const owner = await helper.sdk.getOwnerOf(token);
  expect(owner.toLowerCase()).to.eq(buyer.address.toLowerCase()); // TODO fix case issue

  // seller's balance increased
  // buyer's balance decreased
  const balanceSellerAfter = await helper.getBalance(seller.address, currencyId);
  const balanceBuyerAfter = await helper.getBalance(buyer.address, currencyId);
  // TODO enable sponsoring for collection and contract

  if(currencyId === 0) {
    // For native token subtract tx fee
    // putTx.fee and buyTx.fee should be zero due to sponsoring
    expect(balanceSellerAfter).to.eq(SELLER_INITIAL_BALANCE - approveTx.fee + price);
    expect(balanceBuyerAfter).to.eq(BUYER_INITIAL_BALANCE - price);  
  } else {
    // No Fee in ERC-20 tokens
    expect(balanceSellerAfter).to.eq(SELLER_INITIAL_BALANCE + price);
    expect(balanceBuyerAfter).to.eq(BUYER_INITIAL_BALANCE - price);
  }
}