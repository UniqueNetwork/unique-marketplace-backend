import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { Sdk } from '@unique-nft/sdk/full';
import '@nomicfoundation/hardhat-chai-matchers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { UniqueNFT } from '@unique-nft/solidity-interfaces';
import { Market } from '../../../typechain-types';
import { createSdk, deploy, getAccounts, getCollectionContract, getCollectionData } from './utils';

describe.only('e2e', function () {
  let sdk: Sdk;
  let ownerAccount: SignerWithAddress;
  let sellAccount: SignerWithAddress;
  let buyAccount: SignerWithAddress;
  let uniqueNFT: UniqueNFT;
  let market: Market;
  let marketFee = 10;

  let collectionId: number;
  let tokenId: number;

  async function expectOrder(amount: number) {
    const order = await market.getOrder(collectionId, tokenId);

    expect(order.collectionId).to.be.eq(collectionId);
    expect(order.tokenId).to.be.eq(tokenId);
    expect(order.price).to.be.eq(BigNumber.from(tokenPrice));
    expect(order.amount).to.be.eq(amount);
    expect(order.seller).to.be.eq(sellAccount.address);
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

    market = (await deploy(marketFee)) as Market;
  });

  it('approve', async () => {
    await expect(uniqueNFT.approve(market.address, tokenId)).to.emit(uniqueNFT, 'Approval');
  });

  const tokenPrice = 100;
  const putAmount = 10;
  it('put', async () => {
    await expect(
      market.connect(sellAccount).put(collectionId, tokenId, tokenPrice, putAmount, {
        gasLimit: 10_000_000,
      }),
    )
      .to.emit(market, 'TokenIsUpForSale')
      .withArgs(1, [1, collectionId, tokenId, putAmount, tokenPrice, sellAccount.address]);
  });

  it('check approved', async () => {
    await expect(
      market.connect(ownerAccount).checkApproved(collectionId, tokenId, {
        gasLimit: 10_000_000,
      }),
    )
      .to.emit(market, 'TokenIsApproved')
      .withArgs(1, [1, collectionId, tokenId, putAmount, tokenPrice, sellAccount.address]);
  });

  let ownerBalanceBefore: BigNumber;
  let otherBalanceBefore: BigNumber;
  it('check balances before buy', async () => {
    ownerBalanceBefore = await sellAccount.getBalance();
    otherBalanceBefore = await buyAccount.getBalance();
  });

  it('check order before buy', async () => {
    await expectOrder(putAmount);
  });

  const buyAmount = 2;
  const buyTotalValue = tokenPrice * buyAmount;
  const feeValue = Math.floor((buyTotalValue * marketFee) / 100);
  let buyUsePrice: BigNumber;
  it('buy', async () => {
    const { effectiveGasPrice, cumulativeGasUsed, events } = await (
      await market.connect(buyAccount).buy(collectionId, tokenId, buyAmount, buyAccount.address, 0, {
        value: buyTotalValue,
        gasLimit: 10_000_000,
      })
    ).wait();

    const event = events?.find((log) => log.event === 'TokenIsPurchased');

    expect(event).to.deep.include({
      event: 'TokenIsPurchased',
      args: [1, [1, collectionId, tokenId, putAmount - buyAmount, BigNumber.from(tokenPrice), sellAccount.address], buyAmount],
    });

    buyUsePrice = effectiveGasPrice.mul(cumulativeGasUsed);
  });

  it('check order after buy', async () => {
    await expectOrder(putAmount - buyAmount);
  });

  it('check balances after buy', async function () {
    const ownerBalanceAfter = await sellAccount.getBalance();
    const reward = buyTotalValue - feeValue;
    expect(ownerBalanceAfter.sub(ownerBalanceBefore)).eq(BigNumber.from(reward));

    const otherBalanceAfter = await buyAccount.getBalance();
    const newBalance = otherBalanceBefore.sub(buyUsePrice).sub(BigNumber.from(buyTotalValue));

    expect(otherBalanceAfter).eq(newBalance);
  });

  it.skip('revoke remaining tokens', async () => {
    // todo fail, сейчас не корректно работает с refungible токенами
    await (
      await market.connect(sellAccount).revoke(collectionId, tokenId, putAmount - buyAmount, {
        gasLimit: 10_000_000,
      })
    ).wait();
    /*
    await expect(
      market
        .connect(sellAccount)
        .revoke(collectionId, tokenId, putAmount - buyAmount, {
          gasLimit: 10_000_000,
        })
    )
      .to.emit(market, "TokenRevoke")
      .withArgs("1", [
        collectionId,
        tokenId,
        tokenPrice,
        0,
        sellAccount.address,
      ]);
     */
  });

  it('withdraw', async () => {
    await expect(market.withdraw(buyAccount.address)).to.changeEtherBalances([buyAccount, market], [feeValue, -feeValue]);
  });
});
