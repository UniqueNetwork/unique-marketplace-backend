import hre from 'hardhat';
import { getTestData } from './utils/testData';
import { expect } from 'chai';

describe('Deploy contract', () => {
  it('deploy market', async () => {
    const { sdk, marketplace, collection, accounts: [_, seller] } = await getTestData();
    const PRICE = hre.ethers.utils.parseEther('10');

    const nft = await sdk.createNft(
      collection.collectionId,
      {owner: seller.address}
    );

    (await collection.contract.connect(seller)
      .approve(marketplace.address, nft.tokenId)).wait();

    const puttingOnSale = await marketplace.connect(seller).put(
      collection.collectionId,
      nft.tokenId,
      PRICE,
      1,
      {eth: seller.address, sub: 0},
      {
        gasLimit: 1_000_000
      }
    );
    await puttingOnSale.wait();

    const order = await marketplace.getOrder(collection.collectionId, nft.tokenId);
    expect(order.id).to.eq(1);
    expect(order.collectionId).to.eq(collection.collectionId);
    expect(order.tokenId).to.eq(nft.tokenId);
    expect(order.price).to.eq(PRICE);
    expect(order.seller).to.eq([seller.address, 0n]);
  });

  it('another test', async () => {
    const {marketplace, collection} = await getTestData();

    const order = await marketplace.getOrder(collection.collectionId, 1);
    console.log('done')
  })
});
