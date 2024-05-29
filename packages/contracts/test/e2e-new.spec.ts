import { HDNodeWallet } from 'ethers';
import { TKN } from './utils/currency';
import TestHelper from './utils/TestHelper';
import { expect } from 'chai';
import { TestCollection } from './utils/types';
import { MarketHelper } from './utils/MarketHelper';


describe('Can put for sale and buy', () => {
  let helper: TestHelper;
  let marketplace: MarketHelper;
  let collection: TestCollection;
  const PRICE = TKN(5);
  const INITIAL_BALANCE = TKN(100);

  before(async () => {
    helper = await TestHelper.init();
    marketplace = await helper.deployMarket();
    collection = await helper.createCollectionV2();
  });

  it("using ethereum interface", async () => {
    // 0. arrange
    const [seller, buyer] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
    const token = await helper.createNft(
      collection.collectionId,
      seller.address,
    );

    // 1. approve
    const approveTx = await marketplace.approveNFT(token, seller);

    // 2. put
    const putTx = await marketplace.put({
      collectionId: token.collectionId,
      tokenId: token.tokenId,
      currency: 0,
      price: PRICE,
      signer: seller,
    });

    // 3. Check the order
    const order = await marketplace.getOrder(token);
    expect(order.id).to.eq(marketplace.getLastOrderId());
    expect(order.collectionId).to.eq(BigInt(collection.collectionId));
    expect(order.tokenId).to.eq(BigInt(token.tokenId));
    expect(order.price).to.eq(PRICE);
    expect(order.seller).to.deep.eq(seller.address);

    // 4. buy
    const buyTx = await marketplace.buy({
      collectionId: token.collectionId,
      tokenId: token.tokenId,
      price: PRICE,
      signer: buyer
    });

    // 5. Check order deleted
    await marketplace.expectOrderZero(token);

    // 6. Check token owner: buyer
    const owner = await helper.sdk.getOwnerOf(token);
    expect(owner).to.eq(buyer.address.toLowerCase()); // TODO fix case issue

    // seller's balance increased
    // buyer's balance decreased
    const balanceSellerAfter = await helper.sdk.getBalanceOf(seller.address);
    const balanceBuyerAfter = await helper.sdk.getBalanceOf(buyer.address);
    // TODO enable sponsoring for collection and contract
    expect(balanceSellerAfter).to.eq(INITIAL_BALANCE - approveTx.fee - putTx.fee + PRICE);
    expect(balanceBuyerAfter).to.eq(INITIAL_BALANCE - buyTx.fee - PRICE);
  });

  it.only("using sdk", async () => {
    // 0. arrange
    const [seller, buyer] = await helper.createSubAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
    const token = await helper.createNft(
      collection.collectionId,
      seller.address,
    );

    // 1. approve
    const approveTx = await marketplace.approveNFT(token, seller);

    // 2. put
    const putTx = await marketplace.put({
      collectionId: token.collectionId,
      tokenId: token.tokenId,
      currency: 0,
      price: PRICE,
      signer: seller,
    });

    // 3. Check the order
    const order = await marketplace.getOrder(token);
    expect(order.id).to.eq(marketplace.getLastOrderId());
    expect(order.collectionId).to.eq(BigInt(collection.collectionId));
    expect(order.tokenId).to.eq(BigInt(token.tokenId));
    expect(order.price).to.eq(PRICE);
    expect(order.seller).to.deep.eq(seller.address);

    // 4. buy
    const buyTx = await marketplace.buy({
      collectionId: token.collectionId,
      tokenId: token.tokenId,
      price: PRICE,
      signer: buyer
    });

    // 5. Check order deleted
    await marketplace.expectOrderZero(token);

    // 6. Check token owner: buyer
    const owner = await helper.sdk.getOwnerOf(token);
    expect(owner).to.eq(buyer.address.toLowerCase()); // TODO fix case issue

    // seller's balance increased
    // buyer's balance decreased
    const balanceSellerAfter = await helper.sdk.getBalanceOf(seller.address);
    const balanceBuyerAfter = await helper.sdk.getBalanceOf(buyer.address);
    // TODO enable sponsoring for collection and contract
    expect(balanceSellerAfter).to.eq(INITIAL_BALANCE - approveTx.fee - putTx.fee + PRICE);
    expect(balanceBuyerAfter).to.eq(INITIAL_BALANCE - buyTx.fee - PRICE);
  });
});
