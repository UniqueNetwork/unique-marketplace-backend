import { expect } from 'chai';
import { Sdk } from '@unique-nft/sdk/full';
import '@nomicfoundation/hardhat-chai-matchers';
import { UniqueNFT } from '@unique-nft/solidity-interfaces';
import { Market } from '../../../typechain-types';
import {
  createSdk,
  deploy,
  expectOrderStruct,
  findEventObject,
  getAccounts,
  getCollectionContract,
  getCollectionData,
} from './utils';
import { Address } from '@unique-nft/utils';
import { TokenIsApprovedEventObject, TokenIsPurchasedEventObject, TokenIsUpForSaleEventObject } from '../assemblies/2/market';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

describe.only('e2e', function () {
  let sdk: Sdk;
  let ownerAccount: HardhatEthersSigner;
  let sellAccount: HardhatEthersSigner;
  let buyAccount: HardhatEthersSigner;
  let uniqueNFT: UniqueNFT;
  let market: Market;
  let marketVersion: number;
  let marketFee = 10;

  let collectionId: number;
  let tokenId: number;

  async function getAndExpectOrder(amount: number) {
    const order = await market.getOrder(collectionId, tokenId);
    expectOrderStruct(order, {
      id: 1,
      collectionId,
      tokenId,
      amount,
      price: tokenPrice,
      currency: 0,
      seller: Address.extract.ethCrossAccountId(sellAccount.address),
    });
  }

  it('prepare', async () => {
    sdk = await createSdk();

    const data = await getCollectionData(sdk);
    collectionId = data.nft.collectionId;
    tokenId = data.nft.tokenId;

    const accounts = await getAccounts(sdk, collectionId, tokenId);
    ownerAccount = accounts.ownerAccount;
    sellAccount = accounts.sellAccount;
    buyAccount = accounts.buyAccount;

    uniqueNFT = await getCollectionContract(sellAccount, collectionId);

    [market, marketVersion] = await deploy(marketFee);
  });

  it('approve', async () => {
    const approved = await uniqueNFT.getApproved(tokenId);
    const marketAddress = await market.getAddress();
    if (approved !== marketAddress) {
      await expect(uniqueNFT.approve(marketAddress, tokenId)).to.emit(uniqueNFT, 'Approval');
    }
  });

  const tokenPrice = 100;
  const putAmount = 10;
  it('put', async () => {
    const seller = Address.extract.ethCrossAccountId(sellAccount.address);

    const result = await (
      await market.connect(sellAccount).put(collectionId, tokenId, tokenPrice, 0, putAmount, seller, {
        gasLimit: 10_000_000,
      })
    ).wait();

    const eventObject = findEventObject<TokenIsUpForSaleEventObject>(result, 'TokenIsUpForSale');

    expect(eventObject.version).to.eq(marketVersion);
    expectOrderStruct(eventObject.item, {
      id: 1,
      collectionId,
      tokenId,
      amount: putAmount,
      price: tokenPrice,
      currency: 0,
      seller: seller,
    });
  });

  it('check approved', async () => {
    const result = await (
      await market.connect(ownerAccount).checkApproved(collectionId, tokenId, {
        gasLimit: 10_000_000,
      })
    ).wait();

    const eventObject = findEventObject<TokenIsApprovedEventObject>(result, 'TokenIsApproved');

    expect(eventObject.version).to.eq(marketVersion);
    expectOrderStruct(eventObject.item, {
      id: 1,
      collectionId,
      tokenId,
      amount: putAmount,
      price: tokenPrice,
      currency: 0,
      seller: Address.extract.ethCrossAccountId(sellAccount.address),
    });
  });

  let ownerBalanceBefore: BigNumber;
  let otherBalanceBefore: BigNumber;
  it('check balances before buy', async () => {
    ownerBalanceBefore = await sellAccount.getBalance();
    otherBalanceBefore = await buyAccount.getBalance();
  });

  it('check order before buy', async () => {
    await getAndExpectOrder(putAmount);
  });

  const buyAmount = 2;
  const buyTotalValue = tokenPrice * buyAmount;
  const feeValue = Math.floor((buyTotalValue * marketFee) / 100);
  let buyUsePrice: bigint;
  it('buy', async () => {
    const result = await (
      await market
        .connect(buyAccount)
        .buy(collectionId, tokenId, buyAmount, Address.extract.ethCrossAccountId(buyAccount.address), {
          value: buyTotalValue,
          gasLimit: 10_000_000,
        })
    ).wait();

    const { effectiveGasPrice, cumulativeGasUsed } = result;

    const eventObject = findEventObject<TokenIsPurchasedEventObject>(result, 'TokenIsPurchased');
    expect(eventObject.version).to.eq(marketVersion);
    expect(eventObject.salesAmount).to.eq(buyAmount);
    expectOrderStruct(eventObject.item, {
      id: 1,
      collectionId,
      tokenId,
      amount: putAmount - buyAmount,
      price: tokenPrice,
      currency: 0,
      seller: Address.extract.ethCrossAccountId(sellAccount.address),
    });

    buyUsePrice = effectiveGasPrice.mul(cumulativeGasUsed);
  });

  it('check order after buy', async () => {
    await getAndExpectOrder(putAmount - buyAmount);
  });

  it('check balances after buy', async function () {
    const ownerBalanceAfter = await sellAccount.getBalance();
    const reward = buyTotalValue - feeValue;
    expect(ownerBalanceAfter.sub(ownerBalanceBefore)).eq(BigInt(reward));

    const otherBalanceAfter = await buyAccount.getBalance();
    const newBalance = otherBalanceBefore.sub(buyUsePrice).sub(BigInt(buyTotalValue));

    expect(otherBalanceAfter).eq(newBalance);
  });

  it.skip('revoke remaining tokens', async () => {
    // todo fail, сейчас не корректно работает с refungible токенами
    await (
      await market.connect(sellAccount).revoke(collectionId, tokenId, putAmount - buyAmount, {
        gasLimit: 10_000_000,
      })
    ).wait();

    await expect(
      market.connect(sellAccount).revoke(collectionId, tokenId, putAmount - buyAmount, {
        gasLimit: 10_000_000,
      }),
    )
      .to.emit(market, 'TokenRevoke')
      .withArgs(marketVersion, [collectionId, tokenId, tokenPrice, 0, sellAccount.address]);
  });

  it('withdraw', async () => {
    await expect(market.withdraw({ sub: 0, eth: buyAccount.address }, 0, feeValue)).to.changeEtherBalances(
      [buyAccount, market],
      [feeValue, -feeValue],
    );
  });
});
