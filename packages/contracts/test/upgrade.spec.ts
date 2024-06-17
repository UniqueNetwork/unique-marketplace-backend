import { MarketHelper } from "./utils/MarketHelper";
import TestHelper from "./utils/TestHelper";
import {expect} from 'chai';

let helper: TestHelper;
let marketplace: MarketHelper;

before(async () => {
  helper = await TestHelper.init();
  marketplace = await helper.deployMarket();
});

describe("Upgrade", () => {
  it("cannot call initialize after deploy", async () => {
    await expect((await marketplace.contract.initialize(1, {gasLimit: 300_000})).wait())
      .rejectedWith(/transaction execution reverted/);
  });
});