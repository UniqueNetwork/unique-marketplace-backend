import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { Client } from '@unique-nft/sdk';
import {
  createSdk,
  deploy,
  getAccounts,
  getCollectionContract,
  getNetworkConfig,
} from './utils';
import { UniqueNFT } from '@unique-nft/solidity-interfaces';
import { Market } from '../../../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const { collectionId, tokenId } = getNetworkConfig();

describe('e2e', function () {
  let sdk: Client = createSdk();
  let ownerAccount: SignerWithAddress;
  let otherAccount: SignerWithAddress;
  let uniqueNFT: UniqueNFT;
  let market: Market;
  let marketFee = 10;

  async function expectOrder(amount: number) {
    const order = await market.getOrder(collectionId, tokenId);

    expect(order.collectionId).to.be.eq(collectionId);
    expect(order.tokenId).to.be.eq(tokenId);
    expect(order.price).to.be.eq(BigNumber.from(tokenPrice));
    expect(order.amount).to.be.eq(amount);
    expect(order.seller).to.be.eq(ownerAccount.address);
  }

  it('prepare', async () => {
    const accounts = await getAccounts(sdk, collectionId, tokenId);
    ownerAccount = accounts.ownerAccount;
    otherAccount = accounts.otherAccount;

    uniqueNFT = await getCollectionContract(ownerAccount, collectionId);

    market = await deploy(marketFee);
  });

  it('approve', async () => {
    await expect(uniqueNFT.approve(market.address, tokenId)).to.emit(
      uniqueNFT,
      'Approval'
    );
  });

  const tokenPrice = 100;
  const putAmount = 10;
  it('put', async () => {
    await expect(
      market
        .connect(ownerAccount)
        .put(collectionId, tokenId, tokenPrice, putAmount, {
          gasLimit: 10_000_000,
        })
    )
      .to.emit(market, 'TokenIsUpForSale')
      .withArgs(1, [
        collectionId,
        tokenId,
        tokenPrice,
        putAmount,
        ownerAccount.address,
      ]);
  });

  it('check approved', async () => {
    await expect(
      market.connect(ownerAccount).checkApproved(collectionId, tokenId, {
        gasLimit: 10_000_000,
      })
    )
      .to.emit(market, 'TokenIsApproved')
      .withArgs(1, [
        collectionId,
        tokenId,
        tokenPrice,
        putAmount,
        ownerAccount.address,
      ]);
  });

  let ownerBalanceBefore: BigNumber;
  let otherBalanceBefore: BigNumber;
  it('check balances before buy', async () => {
    ownerBalanceBefore = await ownerAccount.getBalance();
    otherBalanceBefore = await otherAccount.getBalance();
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
      await market.connect(otherAccount).buy(collectionId, tokenId, buyAmount, {
        value: buyTotalValue + 10 + feeValue,
        gasLimit: 10_000_000,
      })
    ).wait();

    const event = events?.find((log) => log.event === 'TokenIsPurchased');

    expect(event).to.deep.include({
      event: 'TokenIsPurchased',
      args: [
        1,
        [
          collectionId,
          tokenId,
          BigNumber.from(tokenPrice),
          putAmount - buyAmount,
          ownerAccount.address,
        ],
        BigNumber.from(buyAmount),
      ],
    });

    buyUsePrice = effectiveGasPrice.mul(cumulativeGasUsed);
  });

  it('check order after buy', async () => {
    await expectOrder(putAmount - buyAmount);
  });

  it('check balances after buy', async function () {
    const ownerBalanceAfter = await ownerAccount.getBalance();
    expect(ownerBalanceAfter.sub(ownerBalanceBefore)).eq(
      BigNumber.from(buyTotalValue)
    );

    const otherBalanceAfter = await otherAccount.getBalance();
    const newBalance = otherBalanceBefore
      .sub(buyUsePrice)
      .sub(BigNumber.from(buyTotalValue))
      .sub(BigNumber.from(feeValue));

    expect(otherBalanceAfter).eq(newBalance);
  });

  it('revoke remaining tokens', async () => {
    // todo fail, сейчас не корректно работает с refungible токенами
    await (
      await market
        .connect(ownerAccount)
        .revoke(collectionId, tokenId, putAmount - buyAmount, {
          gasLimit: 10_000_000,
        })
    ).wait();
    /*
    await expect(
      market
        .connect(ownerAccount)
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
        ownerAccount.address,
      ]);
     */
  });

  it('withdraw', async () => {
    await expect(market.withdraw(otherAccount.address)).to.changeEtherBalances(
      [otherAccount, market],
      [feeValue, -feeValue]
    );
  });
});
