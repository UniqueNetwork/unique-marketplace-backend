import { MarketHelper } from './utils/MarketHelper';
import TestHelper from './utils/TestHelper';
import { expect } from 'chai';
import { TKN } from './utils/currency';
import { canPutOnSale } from './utils/steps';

let helper: TestHelper;
let marketplace: MarketHelper;

before(async () => {
  helper = await TestHelper.init();
  marketplace = await helper.deployMarket();
});

describe('Upgrade', () => {
  it('cannot call initialize after deploy', async () => {
    await expect((await marketplace.contract.initialize(1, { gasLimit: 300_000 })).wait()).rejectedWith(
      /transaction execution reverted/,
    );
  });

  it('can upgrade market with new features', async () => {
    const PRICE = TKN(10, 18);
    const PRICE2 = TKN(11, 18);
    const CURRENCY = 0;

    const [seller] = await helper.createEthAccounts([TKN(100, 18)]);

    const nftCollection = await helper.createNftCollectionV2();
    const nft1 = await helper.createNft(nftCollection.collectionId, seller.address);
    const nft2 = await helper.createNft(nftCollection.collectionId, seller.address);
    await canPutOnSale(seller, nft1, PRICE, CURRENCY, marketplace);

    const orderBefore = await marketplace.getOrder(nft1);
    // ACT: upgrade market
    const upgradedMarket = await helper.upgradeMarket(marketplace.address);

    // ASSERT
    expect(await upgradedMarket.getAddress()).to.eq(marketplace.address);
    // 1. old order exist
    const oldOrder = await upgradedMarket.getOrder(nftCollection.collectionId, nft1.tokenId);

    expect(oldOrder.collectionId).to.eq(nft1.collectionId);
    expect(oldOrder.tokenId).to.eq(nft1.tokenId);
    expect(oldOrder.price).to.eq(PRICE);
    expect(oldOrder.seller.eth).to.deep.eq(seller.address);
    expect(oldOrder.id).to.eq(orderBefore.id);

    // 1.1 New prop uninitialized
    expect(oldOrder.TEST_CAN_ADD_NEW_PROP_TO_STRUCT).to.eq(0);

    // 2. Can put on sale new token
    await canPutOnSale(seller, nft2, PRICE2, CURRENCY, marketplace);
    const orderNew = await upgradedMarket.getOrder(nftCollection.collectionId, nft2.tokenId);

    expect(orderNew.collectionId).to.eq(nft2.collectionId);
    expect(orderNew.tokenId).to.eq(nft2.tokenId);
    expect(orderNew.price).to.eq(PRICE2);
    expect(orderNew.seller.eth).to.deep.eq(seller.address);
    expect(orderNew.id).to.eq(oldOrder.id + 1n);
    expect(orderNew.TEST_CAN_ADD_NEW_PROP_TO_STRUCT).to.eq(await upgradedMarket.TEST_CAN_ADD_NEW_MAGIC_CONSTANT());

    // 3. changePrice changed
    expect(upgradedMarket.connect(seller).changePrice()).to.emit(upgradedMarket, 'TEST_CAN_ADD_NEW_EVENT_AND_CHANGE_METHOD');
  });
});
