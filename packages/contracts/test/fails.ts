import { expect } from 'chai';
import { Sdk } from '@unique-nft/sdk/full';
import '@nomicfoundation/hardhat-chai-matchers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { createSdk, deploy, getAccounts, getCollectionContract, getCollectionData, TokenData } from './utils';

describe('fails', function () {
  let sdk: Sdk;
  let nftToken: TokenData;
  let rftToken: TokenData;
  let fungibleCollectionId: number;
  let sellAccount: SignerWithAddress;
  let buyAccount: SignerWithAddress;

  it('prepare', async () => {
    sdk = await createSdk();

    const data = await getCollectionData(sdk);
    nftToken = data.nft;
    fungibleCollectionId = data.fungibleId;
    rftToken = data.rft;

    const accounts = await getAccounts(sdk, nftToken.collectionId, nftToken.tokenId);
    sellAccount = accounts.sellAccount;
    buyAccount = accounts.buyAccount;
  });

  it('put fail; collection not found', async () => {
    const market = await deploy();

    await expect(market.put(1000000, 1, 3, 1)).to.be.revertedWithCustomError(market, 'CollectionNotFound');
  });

  it('put fail; collection not supported 721', async () => {
    const market = await deploy();

    await expect(market.put(fungibleCollectionId, 1, 3, 1)).to.be.revertedWithCustomError(market, 'CollectionNotSupportedERC721');
  });

  it('put fail; token not found', async () => {
    const market = await deploy();

    await expect(market.put(nftToken.collectionId, 1000, 3, 1)).to.be.revertedWith('token not found');
  });

  it('put fail; user not owner of token', async () => {
    const market = await deploy();

    await expect(market.connect(buyAccount).put(nftToken.collectionId, nftToken.tokenId, 3, 1)).to.be.revertedWithCustomError(
      market,
      'SellerIsNotOwner',
    );
  });

  it('approved fail; order not found', async () => {
    const market = await deploy();

    await expect(market.checkApproved(nftToken.collectionId, nftToken.tokenId)).to.revertedWithCustomError(
      market,
      'OrderNotFound',
    );
  });

  it('approved fail; seller not owner of token', async () => {
    console.log(1);
    const { sellAccount, buyAccount } = await getAccounts(sdk, nftToken.collectionId, nftToken.tokenId);
    const market = await deploy();
    const collection = await getCollectionContract(sellAccount, nftToken.collectionId);
    console.log(2);
    await (await collection.approve(buyAccount.address, nftToken.tokenId)).wait();
    console.log(3);
    await (
      await market.connect(sellAccount).put(nftToken.collectionId, nftToken.tokenId, 3, 1, {
        gasLimit: 10_000_000,
      })
    ).wait();
    console.log(4);
    await (await collection.connect(sellAccount).transferFrom(sellAccount.address, buyAccount.address, nftToken.tokenId)).wait();
    console.log(5);
    await expect(
      market.checkApproved(nftToken.collectionId, nftToken.tokenId, {
        gasLimit: 10_000_000,
      }),
    ).to.emit(market, 'TokenRevoke');
    console.log(6);
    const order = await market.getOrder(nftToken.collectionId, nftToken.tokenId);
    console.log('order', order);
  });

  it('put fail; token is not approved', async () => {
    const { sellAccount } = await getAccounts(sdk, nftToken.collectionId, nftToken.tokenId);
    const market = await deploy();

    await expect(
      market.connect(sellAccount).put(nftToken.collectionId, nftToken.tokenId, 3, 1, {
        gasLimit: 10_000_000,
      }),
    ).to.be.revertedWithCustomError(market, 'TokenIsNotApproved');
  });

  it('buy fail; token is not approved', async () => {
    const { sellAccount, buyAccount } = await getAccounts(sdk, nftToken.collectionId, nftToken.tokenId);
    const market = await deploy();

    await (
      await market.connect(sellAccount).put(nftToken.collectionId, nftToken.tokenId, 10, 1, {
        gasLimit: 10_000_000,
      })
    ).wait();

    await expect(
      market.connect(buyAccount).buy(nftToken.collectionId, nftToken.tokenId, 1, {
        value: 20,
      }),
    )
      .to.be.revertedWithCustomError(market, 'FailTransferToken')
      .withArgs('ApprovedValueTooLow');
  });

  it('buy fail; too many amount requested', async () => {
    const { sellAccount, buyAccount } = await getAccounts(sdk, nftToken.collectionId, nftToken.tokenId);
    const market = await deploy();

    const buyPrice = 10;

    await (
      await market.connect(sellAccount).put(nftToken.collectionId, nftToken.tokenId, buyPrice, 1, {
        gasLimit: 10_000_000,
      })
    ).wait();

    await expect(
      market.connect(buyAccount).buy(nftToken.collectionId, nftToken.tokenId, 2, {
        value: buyPrice * 2,
      }),
    ).to.be.revertedWithCustomError(market, 'TooManyAmountRequested');
  });

  it('buy fail; not enough money', async () => {
    const { sellAccount, buyAccount } = await getAccounts(sdk, nftToken.collectionId, nftToken.tokenId);
    const market = await deploy();

    const buyPrice = 10;

    await (
      await market.connect(sellAccount).put(nftToken.collectionId, nftToken.tokenId, buyPrice, 1, {
        gasLimit: 10_000_000,
      })
    ).wait();

    await expect(
      market.connect(buyAccount).buy(nftToken.collectionId, nftToken.tokenId, 1, {
        value: buyPrice - 1,
      }),
    ).to.be.revertedWithCustomError(market, 'NotEnoughMoneyError');
  });

  it('buy fail; not enough money for fee', async () => {
    const { sellAccount, buyAccount } = await getAccounts(sdk, nftToken.collectionId, nftToken.tokenId);
    const market = await deploy();

    const buyPrice = 10;

    await (
      await market.connect(sellAccount).put(nftToken.collectionId, nftToken.tokenId, buyPrice, 1, {
        gasLimit: 10_000_000,
      })
    ).wait();

    await expect(
      market.connect(buyAccount).buy(nftToken.collectionId, nftToken.tokenId, 1, {
        value: buyPrice,
      }),
    ).to.be.revertedWithCustomError(market, 'NotEnoughMoneyError');
  });
});
