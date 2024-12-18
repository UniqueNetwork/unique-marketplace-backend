import { TokenId } from '@unique-nft/sdk';
import { HDNodeWallet } from 'ethers';
import { MarketAccount, MarketHelper } from './MarketHelper';
import { expect } from 'chai';
import TestHelper from './TestHelper';

export const canPutOnSale = async (
  seller: MarketAccount,
  token: TokenId,
  price: bigint,
  currencyId: number,
  marketplace: MarketHelper,
) => {
  if (!seller.address) throw Error('Cannot get account address');
  const approved = await marketplace.isApproved(token, seller.address);
  // 1. approve
  if (!approved) {
    const approveTx = await marketplace.approveNFT(token, seller);
    expect(await marketplace.isApproved(token, seller.address)).to.be.true;
  }

  // 2. put
  const putTx = await marketplace.put({
    collectionId: token.collectionId,
    tokenId: token.tokenId,
    currency: currencyId,
    amount: 1,
    price,
    signer: seller,
  });

  // 3. Check the order
  const order = await marketplace.getOrder(token);
  expect(order.collectionId).to.eq(BigInt(token.collectionId));
  expect(order.tokenId).to.eq(BigInt(token.tokenId));
  expect(order.price).to.eq(price);
  expect(order.seller).to.deep.eq(seller.address);
  expect(order.id).to.eq(marketplace.getLastOrderId());

  return order;
};

export const canRevoke = async (seller: MarketAccount, token: TokenId, amount = 1, marketplace: MarketHelper) => {
  if (!seller.address) throw Error('Cannot get account address');
  // 1. approve
  const revokeTx = await marketplace.revoke({ token, amount, signer: seller });

  await marketplace.expectOrderZero(token);

  return revokeTx;
};

export const canRevokeAdmin = async (token: TokenId, marketplace: MarketHelper) => {
  const revokeTx = await marketplace.revokeAdmin({ token });

  await marketplace.expectOrderZero(token);

  return revokeTx;
};

export const canPutOnSaleBatch = async (
  seller: MarketAccount,
  tokens: { token: TokenId; price: bigint; currencyId: number }[],
  marketplace: MarketHelper,
) => {
  if (!seller.address) throw Error('Cannot get account address');

  await marketplace.approveAllNFTs(
    tokens.map(({ token }) => ({ ...token })),
    seller,
  );

  if (seller instanceof HDNodeWallet) {
    expect(await marketplace.getApproveForAllEthers(tokens[0].token.collectionId, seller)).to.be.true;
  } else {
    for (const { token } of tokens) {
      expect(await marketplace.isApproved(token, seller.address)).to.be.true;
    }
  }

  // 2. Prepare batch data
  const batchData = tokens.map(({ token, price, currencyId }) => ({
    collectionId: token.collectionId,
    tokenId: token.tokenId,
    currency: currencyId,
    price,
    amount: 1,
  }));

  const putBatchTx = await marketplace.putBatch(batchData, seller);

  // 4. Verify token's order
  for (const { token, price } of tokens) {
    const order = await marketplace.getOrder(token);
    expect(order.collectionId).to.eq(BigInt(token.collectionId));
    expect(order.tokenId).to.eq(BigInt(token.tokenId));
    expect(order.price).to.eq(price);
    expect(order.seller).to.deep.eq(seller.address);
  }

  return putBatchTx;
};

export const canBuy = async (
  buyer: MarketAccount,
  seller: MarketAccount,
  token: TokenId,
  price: bigint,
  currencyId: number,
  marketplace: MarketHelper,
  helper: TestHelper,
) => {
  if (!buyer.address) throw Error('Buyer has no address');
  if (!seller.address) throw Error('Seller has no address');

  const SELLER_INITIAL_BALANCE = await helper.getBalance(seller.address, currencyId);
  const BUYER_INITIAL_BALANCE = await helper.getBalance(buyer.address, currencyId);

  const buyTx = await marketplace.buy({
    collectionId: token.collectionId,
    tokenId: token.tokenId,
    amount: 1,
    price: price,
    signer: buyer,
  });

  // 5. Check order deleted
  await marketplace.expectOrderZero(token);

  // 6. Check token owner: buyer
  const owner = await helper.sdk.getOwnerOf(token);
  expect(owner.toLowerCase()).to.eq(buyer.address.toLowerCase()); // TODO fix case issue

  // seller's balance increased
  // buyer's balance decreased
  const balanceSellerAfter = await helper.getBalance(seller.address, currencyId);
  const balanceBuyerAfter = await helper.getBalance(buyer.address, currencyId);
  // TODO enable sponsoring for collection and contract

  if (currencyId === 0) {
    // For native token subtract tx fee
    // putTx.fee and buyTx.fee should be zero due to sponsoring
    expect(balanceSellerAfter).to.eq(SELLER_INITIAL_BALANCE + price);
    expect(balanceBuyerAfter).to.eq(BUYER_INITIAL_BALANCE - price);
  } else {
    // No Fee in ERC-20 tokens
    expect(balanceSellerAfter).to.eq(SELLER_INITIAL_BALANCE + price);
    expect(balanceBuyerAfter).to.eq(BUYER_INITIAL_BALANCE - price);
  }
};
