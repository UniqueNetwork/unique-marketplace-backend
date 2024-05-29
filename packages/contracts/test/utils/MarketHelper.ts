import { Address } from '@unique-nft/utils';
import { Sr25519Account } from '@unique-nft/sr25519';
import { ethers, upgrades } from 'hardhat';
import { HDNodeWallet, ContractTransactionResponse } from 'ethers';
import { Market } from './../../typechain-types/src/Market.sol/Market';
import { Market__factory, UniqueNFT__factory } from '../../typechain-types';
import { Account, TokenId, ExtrinsicResultResponse, Sdk, EvmSendResultParsed } from '@unique-nft/sdk/full';
import { expect } from 'chai';
import { getNftContract } from './helpers';


export interface MarketOrder {
  collectionId: bigint | number,
  tokenId: bigint | number,
  price: bigint | number,
  amount?: bigint | number,
  currency: bigint | number,
}

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

  async approveNFT(token: TokenId, signer: HDNodeWallet | Account) {
    if (signer instanceof HDNodeWallet)
      return this.approveEthers(token, signer);
    else
      return this.approveSdk(token, signer);
  }

  async put(putArgs: MarketOrder & {signer: HDNodeWallet | Account}) {
    const {collectionId, tokenId, price, currency, signer, amount} = putArgs;

    let result: {hash: string, fee: bigint};
    if (signer instanceof HDNodeWallet)
      result = await this.putEthers({collectionId, tokenId, price, currency, signer, amount});
    else
      result = await this.putSdk({collectionId, tokenId, price, currency, signer, amount});
    this.lastOrderId++;

    return result;
  }

  async buy(putArgs: Omit<MarketOrder, 'currency'> & {signer: HDNodeWallet | Account}) {
    const { collectionId, tokenId, price, signer } = putArgs;
    const amount = putArgs.amount ?? 1;

    if (signer instanceof HDNodeWallet)
      return this.buyEthers(collectionId, tokenId, price, amount, signer);
    else return this.buySdk(collectionId, tokenId, price, amount, signer);
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
    expect(order.seller).to.deep.eq(["0", 0n]);
  }

  private async approveEthers(token: TokenId, signer: HDNodeWallet) {
    const collectionContract = await getNftContract(token.collectionId);
    const response = await collectionContract.connect(signer).approve(this.address, token.tokenId, {gasLimit: 300_000});
    return this.handleTransactionResponse(response);
  }

  private async approveSdk(token: TokenId, signer: Account) {
    const response = await this.sdk.token.approve({
      collectionId: token.collectionId,
      tokenId: token.tokenId,
      spender: this.address,
      isApprove: true,
      address: signer.address
    }, {
      signer: signer.signer
    })

    return this.handleTransactionResponse(response);
  }

  private async buyEthers(
    collectionId: number | bigint,
    tokenId: number | bigint,
    price: number | bigint,
    amount: number | bigint,
    signer: HDNodeWallet,
  ) {
    const response = await this.contract.connect(signer).buy(
      collectionId,
      tokenId,
      amount,
      {eth: signer.address, sub: 0n},
      {
        value: price,
        gasLimit: 2_000_000,
      }
    );

    return this.handleTransactionResponse(response);
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

    const response = await this.sdk.evm.send({
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

    return this.handleTransactionResponse(response);
  }

  private async putEthers(putArgs: MarketOrder & {signer: HDNodeWallet}) {
    const {collectionId, tokenId, price, currency, signer} = putArgs;
    const amount = putArgs.amount ?? 1;

    const response = await this.contract.connect(signer).put(
      collectionId,
      tokenId,
      price,
      currency,
      amount,
      {eth: signer.address, sub: 0},
      {gasLimit: 1_000_000}
    );

    return this.handleTransactionResponse(response);
  }

  private async putSdk(putArgs: MarketOrder & {signer: Account}) {
    const {collectionId, tokenId, price, currency, signer} = putArgs;
    if (!signer.address) throw Error('Signer has no address');

    const amount = putArgs.amount ?? 1;

    const publicAddress = Address.extract.substratePublicKey(signer.address);
    const response = await this.sdk.evm.send({
      abi: this.abi,
      funcName: 'put',
      args: [collectionId, tokenId, price.toString(), currency, amount, ["0x0000000000000000000000000000000000000000", publicAddress]],
      contractAddress: this.address,
      gasLimit: 300_000,
      address: signer.address
    }, {
      signer: signer.signer
    });

    return this.handleTransactionResponse(response);
  }

  private async handleTransactionResponse<T>(
    response: ExtrinsicResultResponse<T> | ContractTransactionResponse
  ): Promise<{hash: string, fee: bigint}> {
    if (response instanceof ContractTransactionResponse) {
      const receipt = await response.wait();
      if (!receipt) throw Error("Cannot get receipt");
      const { hash, fee } = receipt;
      return { hash, fee };
    } else {
      const {hash, events} = response;
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

