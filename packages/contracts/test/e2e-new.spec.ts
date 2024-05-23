import { TKN } from './utils/currency';
import hre from 'hardhat';
import TestHelper from './utils/TestHelper';
import { expect } from 'chai';
import { Market } from '../typechain-types';
import { TestCollection } from './utils/types';

describe('Can put for sale and buy', () => {
  let helper: TestHelper;
  let marketplace: Market;
  let collection: TestCollection;

  before(async () => {
      helper = await TestHelper.init();
      marketplace = await helper.deployMarket();
      collection = await helper.createCollectionV2();
    }
  )

  it('using ethereum accounts', async () => {
    const PRICE = hre.ethers.parseEther('10');
    const INITIAL_BALANCE = TKN(10);
    const seller = await helper.createAccount(INITIAL_BALANCE);
    const buyer = await helper.createAccount(INITIAL_BALANCE);

    const nft = await helper.createNft(
      collection.collectionId,
      seller.address,
    );

    const approveTx = await collection.contract.connect(seller).approve(marketplace, nft.tokenId);
    const approveReceipt = await approveTx.wait();
    if (!approveReceipt) throw Error('No receipt');

    const approveTxFee = approveReceipt.gasUsed * approveReceipt.gasPrice;

    const putTx = await marketplace.connect(seller).put(
      collection.collectionId,
      nft.tokenId,
      PRICE,
      1,
      0,
      {eth: seller.address, sub: 0},
      {
        gasLimit: 1_000_000
      }
    );
    const putReceipt = await putTx.wait();
    if (!putReceipt) throw Error('No receipt');

    const putTxFee = putReceipt.gasUsed * putReceipt.gasPrice;

    // Check the order
    const order = await marketplace.getOrder(collection.collectionId, nft.tokenId);
    expect(order.id).to.eq(1); // TODO cannot check id like that
    expect(order.collectionId).to.eq(collection.collectionId);
    expect(order.tokenId).to.eq(nft.tokenId);
    expect(order.price).to.eq(PRICE);
    expect(order.seller).to.deep.eq([seller.address, 0]);

    const buyTx = await marketplace.connect(buyer).buy(
        nft.collectionId,
        nft.tokenId,
        1,
        {eth: buyer.address, sub: 0},
        {
          value: PRICE,
          gasLimit: 1000000,
        }
      );
    const buyReceipt = await buyTx.wait();
    if (!buyReceipt) throw Error('No receipt');
    const buyTxFee = buyReceipt.gasUsed * buyReceipt.gasPrice;

    // Order deleted
    const orderAfterBuy = await marketplace.getOrder(collection.collectionId, nft.tokenId);
    expect(orderAfterBuy.id).to.eq(0);
    expect(orderAfterBuy.collectionId).to.eq(0);
    expect(orderAfterBuy.tokenId).to.eq(0);
    expect(orderAfterBuy.price).to.eq(0);
    expect(orderAfterBuy.seller).to.deep.eq([0, 0]);

    // token owner: buyer
    const owner = await helper.sdk.getOwnerOf(nft);
    expect(owner).to.eq(buyer.address.toLowerCase()); // TODO fix case issue

    // seller's balance increased
    // buyer's balance decreased
    const balanceSellerAfter = await helper.sdk.getBalanceOf(seller.address);
    const balanceBuyerAfter = await helper.sdk.getBalanceOf(buyer.address);
    // TODO enable sponsoring for collection and contract
    expect(balanceSellerAfter).to.eq(INITIAL_BALANCE - approveTxFee - putTxFee + PRICE);
    expect(balanceBuyerAfter).to.eq(INITIAL_BALANCE - buyTxFee - PRICE);
  });
});
