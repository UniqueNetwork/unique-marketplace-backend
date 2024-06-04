import { TokenId } from "@unique-nft/sdk";
import { MarketAccount, MarketHelper } from "./MarketHelper";
import { expect } from "chai";

export const canPutOnSale = async (
  seller: MarketAccount,
  token: TokenId,
  price: bigint,
  currencyId: number,
  marketplace: MarketHelper,
) => {
  if (!seller.address) throw Error('Cannot get account address');
  // 1. approve
  const approveTx = await marketplace.approveNFT(token, seller);

  // 2. put
  const putTx = await marketplace.put({
    collectionId: token.collectionId,
    tokenId: token.tokenId,
    currency: currencyId,
    price,
    signer: seller,
  });

  // 3. Check the order
  const order = await marketplace.getOrder(token);
  expect(order.id).to.eq(marketplace.getLastOrderId());
  expect(order.collectionId).to.eq(BigInt(token.collectionId));
  expect(order.tokenId).to.eq(BigInt(token.tokenId));
  expect(order.price).to.eq(price);
  expect(order.seller).to.deep.eq(seller.address);
}

export const canRevoke = async (
  seller: MarketAccount,
  token: TokenId,
  amount = 1,
  marketplace: MarketHelper,
) => {
  if (!seller.address) throw Error('Cannot get account address');
  // 1. approve
  const revokeTx = await marketplace.revoke({token, amount, signer: seller});

  await marketplace.expectOrderZero(token);

  return revokeTx;
}

export const canRevokeAdmin = async (
  token: TokenId,
  marketplace: MarketHelper,
) => {
  const revokeTx = await marketplace.revokeAdmin({token});

  await marketplace.expectOrderZero(token);

  return revokeTx;
}
