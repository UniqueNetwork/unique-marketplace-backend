import { TKN } from './utils/currency';
import TestHelper from './utils/TestHelper';
import { expect } from 'chai';
import { TestNftCollection } from './utils/types';
import { MarketHelper } from './utils/MarketHelper';
import { canPutOnSale } from './utils/steps';

let helper: TestHelper;
let marketplace: MarketHelper;
let nftCollection: TestNftCollection;

const INITIAL_BALANCE = TKN(10, 18);
const INITIAL_PRICE = TKN(10, 18);
const NEW_PRICE = TKN(12, 18);
const UNQ_CURRENCY = 0;
const ERC20_CURRENCY = 1984;

before(async () => {
  helper = await TestHelper.init();
  marketplace = await helper.deployMarket();
  nftCollection = await helper.createNftCollectionV2();
  await marketplace.registerCurrency(ERC20_CURRENCY, 0);
});

describe('Put on sale', () => {
  it('token owner can put NFT on sale for native currency', async () => {
    const [ethOwner] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
    const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

    // Initial owner puts nft on sale for UNQ
    await canPutOnSale(ethOwner, nft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);
  });

  it('token owner can put NFT on sale for registered ERC-20 currency', async () => {
    const [ethOwner] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
    const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

    // Initial owner puts nft on sale for UNQ
    await canPutOnSale(ethOwner, nft, INITIAL_PRICE, ERC20_CURRENCY, marketplace);
  });

  it('token owner can put on sale an NFT even if it has already been listed by himself', async () => {
    const [ethOwner] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
    const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

    // Initial owner puts nft on sale
    await canPutOnSale(ethOwner, nft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);
    // FIXME: can put up for sale again
    await canPutOnSale(ethOwner, nft, NEW_PRICE, UNQ_CURRENCY, marketplace);
  });

  it('token owner can put on sale an NFT even if it has already been listed by the previous owner', async () => {
    const [ethInitialOwner, ethNewOwner] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
    const nft = await helper.createNft(nftCollection.collectionId, ethInitialOwner.address);

    // Initial owner puts nft on sale
    await canPutOnSale(ethInitialOwner, nft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);
    // Initial owner transfers nft to New owner
    await nftCollection.contract
      .connect(ethInitialOwner)
      .transfer(ethNewOwner, nft.tokenId, { gasLimit: 300_000 })
      .then((t) => t.wait());
    // Check new owner
    expect(await helper.getOwnerOf(nft)).to.eq(ethNewOwner.address.toLowerCase());
    // Order still exists
    const orderBefore = await marketplace.getOrder(nft);
    expect(orderBefore.seller).to.eq(ethInitialOwner.address);

    // FIXME: new owner can put on sale
    await canPutOnSale(ethNewOwner, nft, NEW_PRICE, UNQ_CURRENCY, marketplace);
  });

  it('token owner can put on sale nft if it was removed from black list', async () => {
    const [ethAccount] = await helper.createEthAccounts([INITIAL_BALANCE]);
    const blackListedCollection = await helper.createNftCollectionV2();
    const blackListedNft = await helper.createNft(blackListedCollection.collectionId, ethAccount.address);

    await marketplace.addToBlackList(blackListedCollection.collectionId);
    await marketplace.removeFromBlacklist(blackListedCollection.collectionId);

    await canPutOnSale(ethAccount, blackListedNft, INITIAL_PRICE, UNQ_CURRENCY, marketplace);
  });
});

describe('[Negative] Put on sale', () => {
  it('owner cannot put NFT on sale for non-registered currency', async () => {
    const NON_REGISTERED_CURRENCY = ERC20_CURRENCY + 333;
    const [ethOwner] = await helper.createEthAccounts([INITIAL_BALANCE]);
    const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

    // owner cannot puts nft on sale for some random currency
    await expect(canPutOnSale(ethOwner, nft, INITIAL_PRICE, NON_REGISTERED_CURRENCY, marketplace)).rejectedWith(
      /transaction execution reverted/,
    );
  });

  it('owner cannot put NFT on sale for zero', async () => {
    const ZERO_PRICE = 0n;
    const [ethOwner] = await helper.createEthAccounts([INITIAL_BALANCE]);
    const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

    // owner cannot puts nft on sale for some random currency
    await expect(canPutOnSale(ethOwner, nft, ZERO_PRICE, UNQ_CURRENCY, marketplace)).rejectedWith(
      /transaction execution reverted/,
    );
  });

  it('owner cannot put non-approved NFT on sale', async () => {
    const [ethOwner] = await helper.createEthAccounts([INITIAL_BALANCE]);
    const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

    // no approve - only put
    await expect(
      marketplace.put({
        ...nft,
        currency: UNQ_CURRENCY,
        price: INITIAL_PRICE,
        signer: ethOwner,
      }),
    ).rejectedWith(/transaction execution reverted/);
  });

  it('cannot put non existent NFT on sale', async () => {
    const [ethAccount] = await helper.createEthAccounts([INITIAL_BALANCE]);
    const nonExistentNft = {
      collectionId: nftCollection.collectionId,
      tokenId: 999999999,
    };

    // owner cannot puts nft on sale for some random currency
    await expect(canPutOnSale(ethAccount, nonExistentNft, INITIAL_PRICE, UNQ_CURRENCY, marketplace)).rejectedWith(
      /transaction execution reverted/,
    );
  });

  it('cannot put black-listed NFT on sale', async () => {
    const [ethAccount] = await helper.createEthAccounts([INITIAL_BALANCE]);
    const blackListedCollection = await helper.createNftCollectionV2();
    const blackListedNft = await helper.createNft(blackListedCollection.collectionId, ethAccount.address);

    await marketplace.addToBlackList(blackListedCollection.collectionId);

    await expect(canPutOnSale(ethAccount, blackListedNft, INITIAL_PRICE, UNQ_CURRENCY, marketplace)).rejectedWith(
      /transaction execution reverted/,
    );
  });

  it('cannot put fungible on sale', async () => {
    const [ethAccount] = await helper.createEthAccounts([INITIAL_BALANCE]);
    const funCollection = await helper.createFungibleCollection(6);
    await helper.topUpFungibleBalance(funCollection.collectionId, TKN(1000, 6), ethAccount.address);
    await marketplace.registerCurrency(funCollection.collectionId, 0);

    await marketplace.approveFungible(funCollection.collectionId, TKN(10, 6), ethAccount);
    await expect(
      marketplace.put({
        collectionId: funCollection.collectionId,
        tokenId: 0,
        currency: UNQ_CURRENCY,
        price: 100,
        signer: ethAccount,
      }),
    ).rejectedWith(/transaction execution reverted/);
  });

  it('non-owner cannot put on sale an NFT', async () => {
    const [ethOwner, ethNonOwner] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
    const nft = await helper.createNft(nftCollection.collectionId, ethOwner.address);

    await expect(
      marketplace.put({
        ...nft,
        currency: UNQ_CURRENCY,
        price: INITIAL_PRICE,
        signer: ethNonOwner,
      }),
    ).rejectedWith(/transaction execution reverted/);

    await marketplace.expectOrderZero(nft);
  });
});
