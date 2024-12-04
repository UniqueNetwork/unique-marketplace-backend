import { ethers, upgrades, network } from 'hardhat';
import { TestOldMarket__factory } from '../typechain-types';
import TestHelper from '../test/utils/TestHelper';
import { TKN } from '../test/utils/currency';
import { getNftContract } from '../test/utils/helpers';

const EXISTING_MARKET_ADDRESS = '0xBce3FD700B2bCaFC1a5Fb6aB3230851DC2Dc09A6';

const PRICE = TKN(10, 18);
const PRICE2 = TKN(11, 18);

async function main() {
  console.log(network.name);
  const [ethereumSigner] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(ethereumSigner);
  console.log('Network:', network.name);
  console.log('Signer address:', ethereumSigner.address);
  console.log('Signer balance is:', balance / 10n ** 18n);
  const helper = await TestHelper.init();
  const marketOld = TestOldMarket__factory.connect(EXISTING_MARKET_ADDRESS, ethereumSigner);

  console.log('Check that old contract works with old put data struct')

  const nftCollection = await helper.createNftCollectionV2();
  const [nft1, nft2] = await helper.createMultipleNfts(nftCollection.collectionId, [
    { owner: ethereumSigner.address, collectionId: nftCollection.collectionId },
    { owner: ethereumSigner.address, collectionId: nftCollection.collectionId },
    { owner: ethereumSigner.address, collectionId: nftCollection.collectionId },
    { owner: ethereumSigner.address, collectionId: nftCollection.collectionId },
  ]);

  console.log('approve...')
  const collectionContract = await getNftContract(nft1.collectionId);
  await collectionContract.connect(ethereumSigner).approve(EXISTING_MARKET_ADDRESS, nft1.tokenId, { gasLimit: 300_000 });
  await collectionContract.connect(ethereumSigner).approve(EXISTING_MARKET_ADDRESS, nft2.tokenId, { gasLimit: 300_000 });

  const sellTx = await marketOld.put(
    nft1.collectionId,
    nft1.tokenId,
    PRICE,
    0,
    1,
    { eth: ethereumSigner.address, sub: 0 },
    { gasLimit: 2000_000 },
  );
  await sellTx.wait();

  const order = await marketOld.getOrder(nft1.collectionId, nft1.tokenId);

  if (order[4] !== PRICE) {
    throw Error('Wrong order');
  }
  console.log(order, 'ORDER');
  console.log('Upgrading Market contract...');

  const UpgradedMarketFactory = await ethers.getContractFactory('Market');

  // const marketUpgraded = await upgrades.forceImport(EXISTING_MARKET_ADDRESS, UpgradedMarketFactory, {
  //   txOverrides: { gasLimit: 6000_000 },
  // });

  const marketUpgraded = await upgrades.upgradeProxy(EXISTING_MARKET_ADDRESS, UpgradedMarketFactory, {
    txOverrides: { gasLimit: 6000_000 },
  });

  const addressAfterUpgrade = await marketUpgraded.getAddress();

  console.log(addressAfterUpgrade, 'addressAfterUpgrade');
  if (addressAfterUpgrade !== EXISTING_MARKET_ADDRESS) {
    throw Error('Wrong address');
  }

  console.log('Check old order');
  const orderOld = await marketUpgraded.getOrder(nft1.collectionId, nft1.tokenId);
  // const marketUpgradedConnect = Market__factory.connect(EXISTING_MARKET_ADDRESS, ethereumSigner);
  // const orderOld = await marketUpgradedConnect.getOrder(nft1.collectionId, nft1.tokenId);

  if (orderOld[4] !== PRICE) {
    throw Error('No old order');
  }

  console.log('Check upgraded contract with new new data struct');

  const sellTx2 = await marketUpgraded.put(
    {
      collectionId: nft2.collectionId,
      tokenId: nft2.tokenId,
      currency: 0,
      amount: 1,
      price: PRICE2,
      seller: { eth: ethereumSigner.address, sub: 0 },
    },
    { gasLimit: 2000_000 },
  );

  await sellTx2.wait();
  const order2 = await marketUpgraded.getOrder(nft2.collectionId, nft2.tokenId);

  console.log(order2, 'ORDER_2');
  if (order2[4] !== PRICE2) {
    throw Error('Wrong order 2');
  }

  // verify new put structure
  console.log(`Market contract upgraded successfully. Address: ${await marketUpgraded.getAddress()}`);

  return;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
