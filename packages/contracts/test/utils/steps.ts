import { TokenId } from '@unique-nft/sdk';
import { HDNodeWallet } from 'ethers';
import { MarketAccount, MarketHelper } from './MarketHelper';
import { expect } from 'chai';

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

  await marketplace.approveAllNFTs(tokens.map(({token}) => ({...token})), seller);

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
