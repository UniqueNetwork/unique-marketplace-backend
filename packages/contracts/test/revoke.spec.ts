import { TKN } from './utils/currency';
import TestHelper from './utils/TestHelper';
import { TestFungibleCollection, TestNftCollection } from './utils/types';
import { MarketHelper } from './utils/MarketHelper';
import { canPutOnSale, canRevoke } from './utils/steps';

let helper: TestHelper;
let marketplace: MarketHelper;
let nftCollection: TestNftCollection;
let fungibleCollection: TestFungibleCollection;

describe('Revoke', () => {
  before(async () => {
    helper = await TestHelper.init();
    marketplace = await helper.deployMarket();
    nftCollection = await helper.createNftCollectionV2();
    fungibleCollection = await helper.createFungibleCollection(6);
    await marketplace.registerCurrency(fungibleCollection.collectionId, 0);
  });

  it('token owner can revoke', async () => {
    const INITIAL_BALANCE = TKN(10, 18);
    const [ethSeller] = await helper.createEthAccounts([INITIAL_BALANCE]);

    const nft = await helper.createNft(nftCollection.collectionId, ethSeller.address);
    await canPutOnSale(ethSeller, nft, TKN(200, 18), 0, marketplace);
    await marketplace.revoke({token: nft, signer: ethSeller});
    await marketplace.expectOrderZero(nft);
  });

  it('admin can revokeAdmin', async () => {
    const INITIAL_BALANCE = TKN(10, 18);
    const [ethSeller] = await helper.createEthAccounts([INITIAL_BALANCE]);

    const nft = await helper.createNft(nftCollection.collectionId, ethSeller.address);
    await canPutOnSale(ethSeller, nft, TKN(200, 18), 0, marketplace);
    await marketplace.revokeAdmin({token: nft});
    await marketplace.expectOrderZero(nft);
  });

  it('admin can revoke with checkApproved if allowance is zero', async () => {
    const INITIAL_BALANCE = TKN(20, 18);
    const [ethSeller] = await helper.createEthAccounts([INITIAL_BALANCE]);

    const nft = await helper.createNft(nftCollection.collectionId, ethSeller.address);
    await canPutOnSale(ethSeller, nft, TKN(200, 18), 0, marketplace);
    // remove allowance
    await marketplace.removeAllowanceNFT(nft, ethSeller);

    // checkApproved removes order
    await marketplace.checkApproved({token: nft});
    await marketplace.expectOrderZero(nft);
  });

  it('token owner can put on sale after revoke', async () => {
    const INITIAL_BALANCE = TKN(10, 18);
    const [ethSeller] = await helper.createEthAccounts([INITIAL_BALANCE]);

    const nft = await helper.createNft(nftCollection.collectionId, ethSeller.address);
    await canPutOnSale(ethSeller, nft, TKN(200, 18), 0, marketplace);
    await canRevoke(ethSeller, nft, 1, marketplace);
    await canPutOnSale(ethSeller, nft, TKN(300, 18), 0, marketplace);
  });
});
