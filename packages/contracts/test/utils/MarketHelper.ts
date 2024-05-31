import { Address } from '@unique-nft/utils';
import { ethers, upgrades } from 'hardhat';
import { HDNodeWallet, ContractTransactionResponse } from 'ethers';
import { Market } from './../../typechain-types/src/Market.sol/Market';
import { Market__factory } from '../../typechain-types';
import { Account, TokenId, ExtrinsicResultResponse, Sdk } from '@unique-nft/sdk/full';
import { expect } from 'chai';
import { convertBigintToNumber, getFungibleContract, getNftContract } from './helpers';


export interface MarketOrder {
  collectionId: bigint | number,
  tokenId: bigint | number,
  price: bigint | number,
  amount?: bigint | number,
  currency: bigint | number,
}

export type TransactionResponse<T> = ExtrinsicResultResponse<T> | ContractTransactionResponse;

export type MarketAccount = HDNodeWallet | Account;

export type CrossAddress = {eth: string, sub: bigint}

export class MarketHelper {
  readonly contract: Market;
  readonly address: string;
  readonly abi: any;
  
  private lastOrderId = 0n;

  private sdk: Sdk;

  constructor(sdk: Sdk, market: Market, marketAddress: string) {
    this.contract = market;
    this.address = marketAddress;
    this.sdk = sdk;
    this.abi = JSON.parse(JSON.stringify(Market__factory.abi)).map((o: any) => {
      if (!o.outputs) o.outputs = [];
      return o;
    });
  }

  static async deployProxy() {
    const signer = (await ethers.getSigners())[0];
    const MarketFactory = await ethers.getContractFactory('Market', signer);

    const contract = await upgrades.deployProxy(MarketFactory, [0], {
      initializer: 'initialize',
      txOverrides: {
        gasLimit: 7_000_000,
      }
    });

    await contract.waitForDeployment();
    const address = await contract.getAddress();
    const market = Market__factory.connect(address, ethers.provider);
    return market;
  }

  async registerCurrency(collectionId: number, marketFee: number) {
    const response = await this.contract.addCurrency(collectionId, marketFee, {
      gasLimit: 300_000
    });
    await this.handleTransactionResponse(response);
  }

  async approveNFT(token: TokenId, signer: MarketAccount) {
    const response = signer instanceof HDNodeWallet 
      ? await this.approveNftEthers(token, signer)
      : await this.approveNftSdk(token, signer);

    return this.handleTransactionResponse(response);
  }

  async approveFungible(collectionId: number, amount: bigint, signer: MarketAccount) {
    let response;
    if (signer instanceof HDNodeWallet)
      response = await this.approveFungibleEthers(collectionId, amount, signer);
    else {
      // TODO use bigint for amount when sdk will have amountInWei
      const decimals = collectionId === 0
        ? 18
        : (await this.sdk.fungible.getCollection({collectionId})).decimals;

      const amountToNumber = convertBigintToNumber(amount, decimals);
      response = await this.approveFungibleSdk(collectionId, amountToNumber, signer);
    }

    return this.handleTransactionResponse(response);
  }

  async put(putArgs: MarketOrder & {signer: MarketAccount}) {
    const {collectionId, tokenId, price, currency, signer, amount} = putArgs;

    let result: {hash: string, fee: bigint};

    const response = signer instanceof HDNodeWallet
      ? await this.putEthers({collectionId, tokenId, price, currency, signer, amount})
      : await this.putSdk({collectionId, tokenId, price, currency, signer, amount});

    this.lastOrderId++;

    return this.handleTransactionResponse(response);
  }

  async buy(putArgs: Omit<MarketOrder, 'currency'> & {signer: MarketAccount}) {
    const { collectionId, tokenId, price, signer } = putArgs;
    const amount = putArgs.amount ?? 1;

    const response = signer instanceof HDNodeWallet
      ? await this.buyEthers(collectionId, tokenId, price, amount, signer)
      : await this.buySdk(collectionId, tokenId, price, amount, signer);

    return this.handleTransactionResponse(response);
  }

  async getOrder(token: TokenId): Promise<MarketOrder & {seller: string} & { id: bigint }> {
    const {id, collectionId, tokenId, price, currency, amount, seller} 
      = await this.contract.getOrder(token.collectionId, token.tokenId);

    const sellerAddress = seller.sub !== 0n 
      ? Address.substrate.encode(seller.sub)
      : seller.eth;

    return {
      id, collectionId, tokenId, price, currency, amount, seller: sellerAddress
    }
  }

  getLastOrderId() {
    return this.lastOrderId;
  }

  async expectOrderZero(token: TokenId) {
    const order = await this.getOrder(token);
    expect(order.id).to.eq(0n);
    expect(order.collectionId).to.eq(0n);
    expect(order.tokenId).to.eq(0n);
    expect(order.price).to.eq(0n);
    expect(order.seller).to.be.oneOf(["0x0000000000000000000000000000000000000000", 0]);
  }

  private async approveFungibleEthers(collectionId: number, amount: bigint, signer: HDNodeWallet) {
    const collectionContract = await getFungibleContract(collectionId);
    return collectionContract
      .connect(signer)
      .approve(this.address, amount, {gasLimit: 300_000});
  }

  private async approveFungibleSdk(collectionId: number, amount: number, signer: Account) {
    return this.sdk.fungible.approveTokens({
      collectionId,
      amount,
      spender: this.address,
      address: signer.address
    }, {
      signer: signer.signer
    });
  }

  private async approveNftEthers(token: TokenId, signer: HDNodeWallet) {
    const collectionContract = await getNftContract(token.collectionId);
    return collectionContract.connect(signer).approve(this.address, token.tokenId, {gasLimit: 300_000});
  }

  private async approveNftSdk(token: TokenId, signer: Account) {
    return this.sdk.token.approve({
      collectionId: token.collectionId,
      tokenId: token.tokenId,
      spender: this.address,
      isApprove: true,
      address: signer.address
    }, {
      signer: signer.signer
    })
  }

  private async buyEthers(
    collectionId: number | bigint,
    tokenId: number | bigint,
    price: number | bigint,
    amount: number | bigint,
    signer: HDNodeWallet,
  ) {
    return this.contract.connect(signer).buy(
      collectionId,
      tokenId,
      amount,
      {eth: signer.address, sub: "0"},
      {
        value: price,
        gasLimit: 2_000_000,
      }
    );
  }

  private async buySdk(
    collectionId: number | bigint,
    tokenId: number | bigint,
    price: number | bigint,
    amount: number | bigint,
    signer: Account,
  ) {
    if (!signer.address) throw Error('Signer has no address');

    const publicAddress = Address.extract.substratePublicKey(signer.address);

    return this.sdk.evm.send({
      abi: this.abi,
      funcName: 'buy',
      args: [collectionId, tokenId, amount, ["0x0000000000000000000000000000000000000000", publicAddress]],
      contractAddress: this.address,
      address: signer.address,
      gasLimit: 300_000,
      value: price.toString()
    }, {
      signer: signer.signer
    });
  }

  private async putEthers(putArgs: MarketOrder & {signer: HDNodeWallet}) {
    const {collectionId, tokenId, price, currency, signer} = putArgs;
    const amount = putArgs.amount ?? 1;

    return this.contract.connect(signer).put(
      collectionId,
      tokenId,
      price,
      currency,
      amount,
      {eth: signer.address, sub: 0},
      {gasLimit: 1_000_000}
    );
  }

  private async putSdk(putArgs: MarketOrder & {signer: Account}) {
    const {collectionId, tokenId, price, currency, signer} = putArgs;
    if (!signer.address) throw Error('Signer has no address');

    const amount = putArgs.amount ?? 1;

    const publicAddress = Address.extract.substratePublicKey(signer.address);
    return this.sdk.evm.send({
      abi: this.abi,
      funcName: 'put',
      args: [collectionId, tokenId, price.toString(), currency, amount, ["0x0000000000000000000000000000000000000000", publicAddress]],
      contractAddress: this.address,
      gasLimit: 300_000,
      address: signer.address
    }, {
      signer: signer.signer
    });
  }

  private async handleTransactionResponse<T>(response: TransactionResponse<T>): Promise<{hash: string, fee: bigint}> {
    if (response instanceof ContractTransactionResponse) {
      const receipt = await response.wait();
      if (receipt?.status === 0) throw Error("Ethers transaction failed");
      if (!receipt) throw Error("Cannot get receipt");
      const { hash, fee } = receipt;

      // TODO: For sponsored transactions, the commission is calculated incorrectly
      // Check refund inside substrate
      // const sponsoringRefund = ...
      return { hash, fee };
    } else {
      const {hash, events, error} = response;
      if (error) throw Error("SDK transaction failed")
      let fee = response.fee?.raw ?? 0;
      if (!fee) {
        let feeEvent = events.find(e => e.section === 'treasury' && e.method === 'Deposit');
        if (feeEvent) {
          fee = (feeEvent.data as any)[0];
          if (!fee) fee = '0';
        };
      }
      return { hash, fee: BigInt(fee)};  
    }
  }
}

