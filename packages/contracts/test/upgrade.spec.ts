import { MarketHelper } from './utils/MarketHelper';
import TestHelper from './utils/TestHelper';
import { expect } from 'chai';
import { TKN } from './utils/currency';
import { canBuy, canPutOnSale, canPutOnSaleBatch } from './utils/steps';
import { TestOldMarket } from '../typechain-types/src/test-contracts/TestOldMarket';
import { getNftContract } from './utils/helpers';

let helper: TestHelper;
let marketplace: TestOldMarket;

before(async () => {
  helper = await TestHelper.init();
  marketplace = await helper.deployOldMarket();
});

describe('Upgrade', () => {
  it('cannot call initialize after deploy', async () => {
    const marketplace = await helper.deployMarket();
    await expect((await marketplace.contract.initialize(1, { gasLimit: 300_000 })).wait()).rejectedWith(
      /transaction execution reverted/,
    );
  });

  it('can upgrade market with new features', async () => {
    const PRICE = TKN(10, 18);
    const PRICE2 = TKN(11, 18);
    const CURRENCY = 0;

    const [seller, buyer] = await helper.createEthAccounts([TKN(100, 18), TKN(100, 18)]);

    const nftCollection = await helper.createNftCollectionV2();
    const [nft1, nft2, nft3, nft4] = await helper.createMultipleNfts(nftCollection.collectionId, [
      { owner: seller.address, collectionId: nftCollection.collectionId },
      { owner: seller.address, collectionId: nftCollection.collectionId },
      { owner: seller.address, collectionId: nftCollection.collectionId },
      { owner: seller.address, collectionId: nftCollection.collectionId },
    ]);

    // approve
    const collectionContract = await getNftContract(nft1.collectionId);
    await collectionContract.connect(seller).approve(marketplace, nft1.tokenId, { gasLimit: 300_000 });
    // put
    await marketplace
      .connect(seller)
      .put(nft1.collectionId, nft1.tokenId, PRICE, CURRENCY, 1, { eth: seller.address, sub: 0 }, { gasLimit: 2000_000 })
      .then((tx) => tx.wait());

    const orderBefore = await marketplace.getOrder(nft1.collectionId, nft1.tokenId);

    // ACT: upgrade market
    const upgradedMarket = await helper.upgradeMarket(await marketplace.getAddress());

    // ASSERT
    expect(await upgradedMarket.getAddress()).to.eq(await marketplace.getAddress());
    // 1. old order exist
    const oldOrder = await upgradedMarket.getOrder(nftCollection.collectionId, nft1.tokenId);

    expect(oldOrder.collectionId).to.eq(nft1.collectionId);
    expect(oldOrder.tokenId).to.eq(nft1.tokenId);
    expect(oldOrder.price).to.eq(PRICE);
    expect(oldOrder.seller.eth).to.deep.eq(seller.address);
    expect(oldOrder.id).to.eq(orderBefore.id);

    // 1. Can put on sale new token
    const marketHelper = await MarketHelper.create(helper.sdk.sdk, upgradedMarket);
    await canPutOnSale(seller, nft2, PRICE2, CURRENCY, marketHelper);
    const orderNew = await upgradedMarket.getOrder(nftCollection.collectionId, nft2.tokenId);

    expect(orderNew.collectionId).to.eq(nft2.collectionId);
    expect(orderNew.tokenId).to.eq(nft2.tokenId);
    expect(orderNew.price).to.eq(PRICE2);
    expect(orderNew.seller.eth).to.deep.eq(seller.address);
    expect(orderNew.id).to.eq(oldOrder.id + 1n);

    // 2. Can buy old token

    await canBuy(buyer, seller, nft1, PRICE, CURRENCY, marketHelper, helper);

    // 3. can put on sale batch
    const prices = [PRICE + 1n, PRICE + 2n];
    const batchData = [nft3, nft4].map((nft, i) => ({
      token: nft,
      price: prices[i],
      currencyId: CURRENCY,
      amount: 1,
    }));

    await canPutOnSaleBatch(seller, batchData, marketHelper);
    for (const [i, nft] of [nft3, nft4].entries()) {
      const order = await marketHelper.getOrder(nft);
      expect(order.price).to.eq(prices[i]);
      expect(order.seller.toLowerCase()).to.eq(seller.address.toLowerCase());
    }
  });
});
