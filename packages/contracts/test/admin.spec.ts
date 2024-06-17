import { TKN } from './utils/currency';
import TestHelper from './utils/TestHelper';
import { expect } from 'chai';
import { MarketHelper } from './utils/MarketHelper';
import { TEST_CASE_MODES, TestFungibleCollection } from './utils/types';
import { canPutOnSale } from './utils/steps';

let helper: TestHelper;
let marketplace: MarketHelper;

const INITIAL_BALANCE = TKN(10, 18);
const MARKET_FEE = 12;
const UNQ_CURRENCY = 0;

before(async () => {
  helper = await TestHelper.init();
  marketplace = await helper.deployMarket();
});

describe('Admin', () => {
  it('market owner can add new admin', async () => {
    const [newAdmin] = await helper.createEthAccounts([INITIAL_BALANCE]);
    expect(await marketplace.contract.admins(newAdmin)).to.be.false;

    await marketplace.addAdmin(newAdmin.address);

    expect(await marketplace.contract.admins(newAdmin)).to.be.true;
  });

  it('market owner can remove admin', async () => {
    const [newAdmin] = await helper.createEthAccounts([INITIAL_BALANCE]);
    await marketplace.addAdmin(newAdmin.address);

    expect(await marketplace.contract.admins(newAdmin)).to.be.true;

    await marketplace.removeAdmin(newAdmin.address);
    expect(await marketplace.contract.admins(newAdmin)).to.be.false;
  });

  it('admin can add new admin', async () => {
    const [newAdmin, nonAdmin] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
    await marketplace.addAdmin(newAdmin.address);

    await marketplace.addAdmin(nonAdmin.address, newAdmin);

    expect(await marketplace.contract.admins(nonAdmin)).to.be.true;
  });

  it('admin can remove admin', async () => {
    const [newAdmin1, newAdmin2] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);
    await marketplace.addAdmin(newAdmin1.address);
    await marketplace.addAdmin(newAdmin2.address);

    expect(await marketplace.contract.admins(newAdmin1)).to.be.true;
    expect(await marketplace.contract.admins(newAdmin2)).to.be.true;

    await marketplace.removeAdmin(newAdmin2.address, newAdmin1);

    expect(await marketplace.contract.admins(newAdmin2)).to.be.false;
  });

  it('market owner can set market fee', async () => {
    const MARKET_FEE = 10;

    const newMarket = await helper.deployMarket(0);
    expect(await newMarket.contract.marketFee()).to.eq(0);
    await newMarket.setMarketFee(MARKET_FEE);
    expect(await newMarket.contract.marketFee()).to.eq(MARKET_FEE);
  });

  it('admin can set market fee', async () => {
    const MARKET_FEE = 10;
    const newMarket = await helper.deployMarket(0);

    const [admin] = await helper.createEthAccounts([INITIAL_BALANCE]);
    await newMarket.addAdmin(admin.address);

    expect(await newMarket.contract.marketFee()).to.eq(0);
    await newMarket.setMarketFee(MARKET_FEE, admin);
    expect(await newMarket.contract.marketFee()).to.eq(MARKET_FEE);
  });

  it('market owner can add currency', async () => {
    const newCurrency = await helper.createFungibleCollection(6);

    await marketplace.registerCurrency(newCurrency.collectionId, MARKET_FEE);

    const currencyFromContract = await marketplace.contract.getCurrency(newCurrency.collectionId);

    expect(currencyFromContract.isAvailable).to.be.true;
    expect(currencyFromContract.collectionId).to.eq(newCurrency.collectionId);
    expect(currencyFromContract.fee).to.eq(MARKET_FEE);
  });

  it('market admin can add currency', async () => {
    const [newAdmin] = await helper.createEthAccounts([INITIAL_BALANCE]);
    await marketplace.addAdmin(newAdmin.address);

    const newCurrency = await helper.createFungibleCollection(6);

    await marketplace.registerCurrency(newCurrency.collectionId, MARKET_FEE, newAdmin);

    const currencyFromContract = await marketplace.contract.getCurrency(newCurrency.collectionId);

    expect(currencyFromContract.isAvailable).to.be.true;
    expect(currencyFromContract.collectionId).to.eq(newCurrency.collectionId);
    expect(currencyFromContract.fee).to.eq(MARKET_FEE);
  });

  it('market owner can remove currency', async () => {
    const newCurrency = await helper.createFungibleCollection(6);
    await marketplace.registerCurrency(newCurrency.collectionId, MARKET_FEE);

    // owner removes currency
    await marketplace.removeCurrency(newCurrency.collectionId);
    await marketplace.expectCurrencyNotRegistered(newCurrency.collectionId);
  });

  it('admin can remove currency', async () => {
    const [newAdmin] = await helper.createEthAccounts([INITIAL_BALANCE]);
    await marketplace.addAdmin(newAdmin.address);

    const newCurrency = await helper.createFungibleCollection(6);
    await marketplace.registerCurrency(newCurrency.collectionId, MARKET_FEE);

    // newAdmin removes currency
    await marketplace.removeCurrency(newCurrency.collectionId, newAdmin);
    await marketplace.expectCurrencyNotRegistered(newCurrency.collectionId);
  });

  it('market owner can add/remove from blacklist', async () => {
    const PRICE = 10000n;
    const [seller] = await helper.createAccounts([INITIAL_BALANCE], 'SDK');
    const newCollection = await helper.createNftCollectionV2();
    const newToken = await helper.createNft(newCollection.collectionId, seller.address);

    await marketplace.addToBlackList(newCollection.collectionId);
    await expect(marketplace.put({...newToken, currency: 0, price: PRICE, signer: seller}))
      .rejectedWith('CollectionInBlacklist');
    await marketplace.removeFromBlacklist(newCollection.collectionId);
    await canPutOnSale(seller, newToken, PRICE, 0, marketplace)
  });

  it('admin can add/remove from blacklist', async () => {
    const [newAdmin] = await helper.createEthAccounts([INITIAL_BALANCE]);
    const [seller] = await helper.createAccounts([INITIAL_BALANCE], 'SDK');
    await marketplace.addAdmin(newAdmin.address);

    const PRICE = 10000n;
    const newCollection = await helper.createNftCollectionV2();
    const newToken = await helper.createNft(newCollection.collectionId, seller.address);

    await marketplace.addToBlackList(newCollection.collectionId, newAdmin);
    await expect(marketplace.put({...newToken, currency: 0, price: PRICE, signer: seller}))
      .rejectedWith('CollectionInBlacklist');
    await marketplace.removeFromBlacklist(newCollection.collectionId, newAdmin);
    await canPutOnSale(seller, newToken, PRICE, 0, marketplace)
  });
});

describe('[Negative] Admin', () => {
  it('non-admin cannot add admin', async () => {
    const [nonAdmin1, nonAdmin2] = await helper.createEthAccounts([INITIAL_BALANCE, INITIAL_BALANCE]);

    await expect(marketplace.addAdmin(nonAdmin2.address, nonAdmin1)).rejectedWith(/transaction execution reverted/);

    expect(await marketplace.contract.admins(nonAdmin2)).to.be.false;
  });

  it('non-admin cannot add currency', async () => {
    const [nonAdminEth] = await helper.createEthAccounts([INITIAL_BALANCE]);
    const newCurrency = await helper.createFungibleCollection(6);

    await expect(marketplace.registerCurrency(newCurrency.collectionId, MARKET_FEE, nonAdminEth)).rejectedWith(
      /transaction execution reverted/,
    );

    await marketplace.expectCurrencyNotRegistered(newCurrency.collectionId);
  });

  it('non-admin cannot remove currency', async () => {
    const [nonAdminEth] = await helper.createEthAccounts([INITIAL_BALANCE]);
    const newCurrency = await helper.createFungibleCollection(6);
    await marketplace.registerCurrency(newCurrency.collectionId, MARKET_FEE);

    await expect(marketplace.removeCurrency(newCurrency.collectionId, nonAdminEth)).rejectedWith(
      /transaction execution reverted/,
    );

    const currencyFromContract = await marketplace.contract.getCurrency(newCurrency.collectionId);

    expect(currencyFromContract.isAvailable).to.be.true;
    expect(currencyFromContract.collectionId).to.eq(newCurrency.collectionId);
    expect(currencyFromContract.fee).to.eq(MARKET_FEE);
  });

  it('non-admin cannot set market fee', async () => {
    const MARKET_FEE = 10;
    const market = await helper.deployMarket(0);

    const [nonAdmin] = await helper.createEthAccounts([INITIAL_BALANCE]);

    await expect(market.setMarketFee(MARKET_FEE, nonAdmin))
      .rejectedWith('transaction execution reverted');
  });

  it('owner cannot add currency with fee > 100', async () => {
    const FEE_TOO_LARGE = 101;
    const newCurrency = await helper.createFungibleCollection(6);
    await expect(marketplace.registerCurrency(newCurrency.collectionId, FEE_TOO_LARGE)).rejectedWith(
      /transaction execution reverted/,
    );
  });
});
