import { expect } from "chai";
import { Client } from "@unique-nft/sdk";
import {
  createSdk,
  deploy,
  getAccounts,
  getCollectionContract,
  getNetworkConfig,
} from "./utils";
import { Market } from "../typechain-types";

const { collectionId, tokenId } = getNetworkConfig();

describe("Market", function () {
  let sdk: Client = createSdk();

  it("put fail; collection not found", async () => {
    const market = await deploy();

    await expect(market.put(1000000, 1, 3, 1)).to.be.revertedWithCustomError(
      market,
      "CollectionNotFound"
    );
  });

  it("put fail; collection not supported 721", async () => {
    const market = await deploy();

    await expect(market.put(251, 1, 3, 1)).to.be.revertedWithCustomError(
      market,
      "CollectionNotSupportedERC721"
    );
  });

  it("put fail; token not found", async () => {
    const market = await deploy();

    await expect(market.put(collectionId, 1000, 3, 1)).to.be.revertedWith(
      "token not found"
    );
  });
  it("put fail; user not owner of token", async () => {
    const market = await deploy();

    await expect(
      market.put(collectionId, 2, 3, 1)
    ).to.be.revertedWithCustomError(market, "SellerIsNotOwner");
  });

  it("approved fail; order not found", async () => {
    const market = await deploy();

    await expect(
      market.checkApproved(collectionId, tokenId)
    ).to.revertedWithCustomError(market, "OrderNotFound");
  });

  it("approved fail; seller not owner of token", async () => {
    const { ownerAccount, otherAccount } = await getAccounts(
      sdk,
      collectionId,
      tokenId
    );
    const market = await deploy();
    const collection = await getCollectionContract(ownerAccount, collectionId);

    await (await collection.approve(otherAccount.address, tokenId)).wait();

    await (
      await market.connect(ownerAccount).put(collectionId, tokenId, 3, 1)
    ).wait();

    await (
      await collection
        .connect(ownerAccount)
        .transferFrom(ownerAccount.address, otherAccount.address, tokenId)
    ).wait();

    await expect(
      market.checkApproved(collectionId, tokenId)
    ).to.revertedWithCustomError(market, "SellerIsNotOwner");
  });

  it.skip("put fail; token is not approved", async () => {
    const { ownerAccount } = await getAccounts(sdk, collectionId, tokenId);
    const market = await deploy();

    await expect(
      market.connect(ownerAccount).put(collectionId, tokenId, 3, 1, {
        gasLimit: 10_000_000,
      })
    ).to.be.revertedWithCustomError(market, "TokenIsNotApproved");
  });

  it("buy fail; token is not approved", async () => {
    const { ownerAccount, otherAccount } = await getAccounts(
      sdk,
      collectionId,
      tokenId
    );
    const market = await deploy();

    await (
      await market.connect(ownerAccount).put(collectionId, tokenId, 10, 1, {
        gasLimit: 10_000_000,
      })
    ).wait();

    await expect(
      market.connect(otherAccount).buy(collectionId, tokenId, 1, {
        value: 20,
      })
    )
      .to.be.revertedWithCustomError(market, "FailTransformToken")
      .withArgs("ApprovedValueTooLow");
  });

  it("buy fail; too many amount requested", async () => {
    const { ownerAccount, otherAccount } = await getAccounts(
      sdk,
      collectionId,
      tokenId
    );
    const market = await deploy();

    const buyPrice = 10;

    await (
      await market
        .connect(ownerAccount)
        .put(collectionId, tokenId, buyPrice, 1, {
          gasLimit: 10_000_000,
        })
    ).wait();

    await expect(
      market.connect(otherAccount).buy(collectionId, tokenId, 2, {
        value: buyPrice * 2,
      })
    ).to.be.revertedWithCustomError(market, "TooManyAmountRequested");
  });

  it("buy fail; not enough money", async () => {
    const { ownerAccount, otherAccount } = await getAccounts(
      sdk,
      collectionId,
      tokenId
    );
    const market = await deploy();

    const buyPrice = 10;

    await (
      await market
        .connect(ownerAccount)
        .put(collectionId, tokenId, buyPrice, 1, {
          gasLimit: 10_000_000,
        })
    ).wait();

    await expect(
      market.connect(otherAccount).buy(collectionId, tokenId, 1, {
        value: buyPrice - 1,
      })
    ).to.be.revertedWithCustomError(market, "NotEnoughError");
  });

  it("buy fail; not enough money for fee", async () => {
    const { ownerAccount, otherAccount } = await getAccounts(
      sdk,
      collectionId,
      tokenId
    );
    const market = await deploy();

    const buyPrice = 10;

    await (
      await market
        .connect(ownerAccount)
        .put(collectionId, tokenId, buyPrice, 1, {
          gasLimit: 10_000_000,
        })
    ).wait();

    await expect(
      market.connect(otherAccount).buy(collectionId, tokenId, 1, {
        value: buyPrice,
      })
    ).to.be.revertedWithCustomError(market, "NotEnoughError");
  });
});
