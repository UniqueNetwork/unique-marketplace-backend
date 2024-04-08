import hre from 'hardhat';
import { getTestData } from './utils/testData';
import { expect } from 'chai';

describe('Can put for sale and buy', () => {
  it('using ethereum accounts', async () => {
    const { sdk, marketplace, collection, accounts: [_, seller, buyer] } = await getTestData();
    const PRICE = hre.ethers.utils.parseEther('10');
    const balanceSellerBefore = await sdk.getBalanceOf(seller.address);
    const balanceBuyerBefore = await sdk.getBalanceOf(buyer.address);

    const nft = await sdk.createNft(
      collection.collectionId,
      {owner: seller.address}
    );

    const approveTx = await collection.contract.connect(seller).approve(marketplace.address, nft.tokenId);
    const approveReceipt = await approveTx.wait();
    const approveTxFee = approveReceipt.gasUsed.mul(approveReceipt.effectiveGasPrice);

    const putTx = await marketplace.connect(seller).put(
      collection.collectionId,
      nft.tokenId,
      PRICE,
      1,
      {eth: seller.address, sub: 0},
      {
        gasLimit: 1_000_000
      }
    );
    const putReceipt = await putTx.wait();
    const putTxFee = putReceipt.gasUsed.mul(putReceipt.effectiveGasPrice);

    // Check the order
    const order = await marketplace.getOrder(collection.collectionId, nft.tokenId);
    expect(order.id).to.eq(1); // TODO cannot check id like that
    expect(order.collectionId).to.eq(collection.collectionId);
    expect(order.tokenId).to.eq(nft.tokenId);
    expect(order.price).to.eq(PRICE);
    expect(order.seller).to.deep.eq([seller.address, hre.ethers.BigNumber.from(0)]);

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
    const buyTxFee = buyReceipt.gasUsed.mul(buyReceipt.effectiveGasPrice);

    // Order deleted
    const orderAfterBuy = await marketplace.getOrder(collection.collectionId, nft.tokenId);
    expect(orderAfterBuy.id).to.eq(0);
    expect(orderAfterBuy.collectionId).to.eq(0);
    expect(orderAfterBuy.tokenId).to.eq(0);
    expect(orderAfterBuy.price).to.eq(0);
    expect(orderAfterBuy.seller).to.deep.eq([0, 0]);

    // token owner: buyer
    const owner = await sdk.getOwnerOf(nft);
    expect(owner).to.eq(buyer.address.toLowerCase()); // TODO fix case issue

    // seller's balance increased
    // buyer's balance decreased
    const balanceSellerAfter = await sdk.getBalanceOf(seller.address);
    const balanceBuyerAfter = await sdk.getBalanceOf(buyer.address);
    // TODO enable sponsoring for collection and contract
    expect(balanceSellerAfter).to.eq(balanceSellerBefore.sub(approveTxFee).sub(putTxFee).add(PRICE));
    expect(balanceBuyerAfter).to.eq(balanceBuyerBefore.sub(buyTxFee).sub(PRICE));
  });
});
