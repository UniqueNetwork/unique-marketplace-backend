import { Address } from '@unique-nft/utils';
import { HDNodeWallet, ContractTransactionResponse } from 'ethers';
import { Market } from './../../typechain-types/src/Market.sol/Market';
import { Market__factory } from '../../typechain-types';
import { Account, TokenId, ExtrinsicResultResponse, Sdk } from '@unique-nft/sdk/full';
import { expect } from 'chai';
import { convertBigintToNumber, crossAddressFromAddress, getFungibleContract, getNftContract } from './helpers';
import { IContract } from '@unique-nft/sdk';

export interface MarketOrder {
  collectionId: bigint | number;
  tokenId: bigint | number;
  price: bigint | number;
  amount?: bigint | number;
  currency: bigint | number;
}

export type TransactionResponse<T> = ExtrinsicResultResponse<T> | ContractTransactionResponse;

export type MarketAccount = HDNodeWallet | Account;

export type CrossAddress = { eth: string; sub: bigint };

export class MarketHelper {
  readonly contract: Market;
  readonly contractSdk: IContract;
  readonly address: string;
  readonly abi: any;
  private lastOrderId = 0n;

  private sdk: Sdk;

  private constructor(sdk: Sdk, marketAddress: string, market: Market, marketSdk: IContract, abi: any) {
    this.contract = market;
    this.address = marketAddress;
    this.sdk = sdk;
    this.contractSdk = marketSdk;
    this.abi = abi;
  }

  static async create(sdk: Sdk, market: Market) {
    const marketAddress = await market.getAddress();
    const abi = JSON.parse(JSON.stringify(Market__factory.abi)).map((o: any) => {
      if (!o.outputs) o.outputs = [];
      return o;
    });
    const marketSdk = await sdk.evm.contractConnect(marketAddress, abi);

    return new MarketHelper(sdk, marketAddress, market, marketSdk, abi);
  }

  async addAdmin(newAdmin: string, signer?: HDNodeWallet) {
    const context = signer ? this.contract.connect(signer) : this.contract;
    const response = await context.addAdmin(newAdmin, {
      gasLimit: 300_000,
    });
    return this.handleTransactionResponse(response);
  }

  async removeAdmin(admin: string, signer?: HDNodeWallet) {
    const context = signer ? this.contract.connect(signer) : this.contract;
    const response = await context.removeAdmin(admin, {
      gasLimit: 300_000,
    });
    return this.handleTransactionResponse(response);
  }

  async registerCurrency(collectionId: number, marketFee: number, signer?: HDNodeWallet) {
    const context = signer ? this.contract.connect(signer) : this.contract;
    const response = await context.addCurrency(collectionId, marketFee, {
      gasLimit: 300_000,
    });
    return this.handleTransactionResponse(response);
  }

  async removeCurrency(collectionId: number, signer?: HDNodeWallet) {
    const context = signer ? this.contract.connect(signer) : this.contract;
    const response = await context.removeCurrency(collectionId, {
      gasLimit: 300_000,
    });
    return this.handleTransactionResponse(response);
  }

  async approveNFT(token: TokenId, signer: MarketAccount) {
    return this._approveNFT({ token, signer, isApprove: true });
  }

  async removeAllowanceNFT(token: TokenId, signer: MarketAccount) {
    return this._approveNFT({ token, signer, isApprove: false });
  }

  async approveFungible(collectionId: number, amount: bigint, signer: MarketAccount) {
    let response;
    if (signer instanceof HDNodeWallet) response = await this.approveFungibleEthers(collectionId, amount, signer);
    else {
      // TODO use bigint for amount when sdk will have amountInWei
      const decimals = collectionId === 0 ? 18 : (await this.sdk.fungible.getCollection({ collectionId })).decimals;

      const amountToNumber = convertBigintToNumber(amount, decimals);
      response = await this.approveFungibleSdk(collectionId, amountToNumber, signer);
    }

    return this.handleTransactionResponse(response);
  }

  async put(putArgs: MarketOrder & { signer: MarketAccount }) {
    const { collectionId, tokenId, price, currency, signer, amount } = putArgs;

    const response =
      signer instanceof HDNodeWallet
        ? await this.putEthers({ collectionId, tokenId, price, currency, signer, amount })
        : await this.putSdk({ collectionId, tokenId, price, currency, signer, amount });

    const handleResult = await this.handleTransactionResponse(response);
    this.lastOrderId++;

    return handleResult;
  }

  async changePrice(args: { token: TokenId; newPrice: bigint; currency: number; signer: MarketAccount }) {
    const { token, newPrice, currency, signer } = args;
    if (signer instanceof HDNodeWallet) {
      const response = await this.contract
        .connect(signer)
        .changePrice(token.collectionId, token.tokenId, newPrice, currency, { gasLimit: 300_000 });
      return this.handleTransactionResponse(response);
    } else {
      const response = await this.contractSdk.send(
        {
          funcName: 'changePrice',
          args: [token.collectionId, token.tokenId, newPrice.toString(), currency],
          address: signer.address,
          gasLimit: 300_000,
        },
        {
          signer: signer.signer,
        },
      );
      return this.handleTransactionResponse(response);
    }
  }

  async buy(putArgs: Omit<MarketOrder, 'currency'> & { signer: MarketAccount }) {
    const { collectionId, tokenId, price, signer } = putArgs;
    const amount = putArgs.amount ?? 1;

    const response =
      signer instanceof HDNodeWallet
        ? await this.buyEthers(collectionId, tokenId, price, amount, signer)
        : await this.buySdk(collectionId, tokenId, price, amount, signer);

    return this.handleTransactionResponse(response);
  }

  async revoke(revokeArgs: { token: TokenId; amount?: number; signer: MarketAccount }) {
    const { collectionId, tokenId } = revokeArgs.token;
    const amount = revokeArgs.amount ? revokeArgs.amount : 1;
    if (revokeArgs.signer instanceof HDNodeWallet) {
      const response = await this.contract
        .connect(revokeArgs.signer)
        .revoke(collectionId, tokenId, amount, { gasLimit: 300_000 });

      return this.handleTransactionResponse(response);
    }
    const response = await this.contractSdk.send(
      {
        funcName: 'revoke',
        args: [collectionId, tokenId, amount],
        address: revokeArgs.signer.address,
        gasLimit: 300_000,
      },
      {
        signer: revokeArgs.signer.signer,
      },
    );
    return this.handleTransactionResponse(response);
  }

  async revokeAdmin(revokeArgs: { token: TokenId }) {
    const { collectionId, tokenId } = revokeArgs.token;
    const response = await this.contract.revokeAdmin(collectionId, tokenId, { gasLimit: 300_000 });

    return this.handleTransactionResponse(response);
  }

  async revokeListAdmin(collectionId: number, tokenIds: number[]) {
    const response = await this.contract.revokeListAdmin(collectionId, tokenIds, { gasLimit: 300_000 });

    return this.handleTransactionResponse(response);
  }

  async isApproved(token: TokenId, by: string) {
    const { isAllowed } = await this.sdk.token.allowance({ ...token, from: by, to: this.address });
    return isAllowed;
  }

  async checkApproved(args: { token: TokenId }) {
    const { collectionId, tokenId } = args.token;
    const response = await this.contract.checkApproved(collectionId, tokenId, { gasLimit: 300_000 });

    return this.handleTransactionResponse(response);
  }

  async addToBlackList(collectionId: number) {
    const response = await this.contract.addToBlacklist(collectionId, { gasLimit: 300000 });
    return this.handleTransactionResponse(response);
  }

  async removeFromBlacklist(collectionId: number) {
    const response = await this.contract.removeFromBlacklist(collectionId, { gasLimit: 300000 });
    return this.handleTransactionResponse(response);
  }

  async withdraw(to: string, currency: number, amount: bigint, signer?: HDNodeWallet) {
    const context = signer ? this.contract.connect(signer) : this.contract;

    const response = await context.withdraw(crossAddressFromAddress(to), currency, amount, { gasLimit: 300_000 });
    return this.handleTransactionResponse(response);
  }

  async getOrder(token: TokenId): Promise<MarketOrder & { seller: string } & { id: bigint }> {
    const { id, collectionId, tokenId, price, currency, amount, seller } = await this.contract.getOrder(
      token.collectionId,
      token.tokenId,
    );

    const sellerAddress = seller.sub !== 0n ? Address.substrate.encode(seller.sub) : seller.eth;

    return {
      id,
      collectionId,
      tokenId,
      price,
      currency,
      amount,
      seller: sellerAddress,
    };
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
    expect(order.seller).to.be.oneOf(['0x0000000000000000000000000000000000000000', 0]);
  }

  async expectCurrencyNotRegistered(collectionId: number) {
    const currency = await this.contract.getCurrency(collectionId);
    expect(currency.isAvailable).to.be.false;
    expect(currency.collectionId).to.eq(0);
    expect(currency.fee).to.eq(0);
  }

  // ---------------- PRIVATE ----------------- //

  private async approveFungibleEthers(collectionId: number, amount: bigint, signer: HDNodeWallet) {
    const collectionContract = await getFungibleContract(collectionId);
    return collectionContract.connect(signer).approve(this.address, amount, { gasLimit: 300_000 });
  }

  private async approveFungibleSdk(collectionId: number, amount: number, signer: Account) {
    return this.sdk.fungible.approveTokens(
      {
        collectionId,
        amount,
        spender: this.address,
        address: signer.address,
      },
      {
        signer: signer.signer,
      },
    );
  }

  private async _approveNFT(args: { token: TokenId; isApprove?: boolean; signer: MarketAccount }) {
    const { token, signer } = args;
    const isApprove = args.isApprove ?? true;
    const response =
      signer instanceof HDNodeWallet
        ? await this.approveNftEthers(token, signer, isApprove)
        : await this.approveNftSdk(token, signer, isApprove);

    return this.handleTransactionResponse(response);
  }

  private async approveNftEthers(token: TokenId, signer: HDNodeWallet, isApprove: boolean) {
    const collectionContract = await getNftContract(token.collectionId);
    const approvedAddress = isApprove ? this.address : signer.address;
    return collectionContract.connect(signer).approve(approvedAddress, token.tokenId, { gasLimit: 300_000 });
  }

  private async approveNftSdk(token: TokenId, signer: Account, isApprove: boolean) {
    return this.sdk.token.approve(
      {
        collectionId: token.collectionId,
        tokenId: token.tokenId,
        spender: this.address,
        isApprove: isApprove,
        address: signer.address,
      },
      {
        signer: signer.signer,
      },
    );
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
      { eth: signer.address, sub: '0' },
      {
        value: price,
        gasLimit: 300_000,
      },
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

    return this.contractSdk.send(
      {
        funcName: 'buy',
        args: [collectionId, tokenId, amount, ['0x0000000000000000000000000000000000000000', publicAddress]],
        address: signer.address,
        gasLimit: 300_000,
        value: price.toString(),
      },
      {
        signer: signer.signer,
      },
    );
  }

  private async putEthers(putArgs: MarketOrder & { signer: HDNodeWallet }) {
    const { collectionId, tokenId, price, currency, signer } = putArgs;
    const amount = putArgs.amount ?? 1;

    return this.contract
      .connect(signer)
      .put(collectionId, tokenId, price, currency, amount, { eth: signer.address, sub: 0 }, { gasLimit: 1_000_000 });
  }

  private async putSdk(putArgs: MarketOrder & { signer: Account }) {
    const { collectionId, tokenId, price, currency, signer } = putArgs;
    if (!signer.address) throw Error('Signer has no address');

    const amount = putArgs.amount ?? 1;

    const publicAddress = Address.extract.substratePublicKey(signer.address);

    return this.contractSdk.send(
      {
        funcName: 'put',
        args: [
          collectionId,
          tokenId,
          price.toString(),
          currency,
          amount,
          ['0x0000000000000000000000000000000000000000', publicAddress],
        ],
        gasLimit: 300_000,
        address: signer.address,
      },
      {
        signer: signer.signer,
      },
    );
  }

  private async handleTransactionResponse<T>(response: TransactionResponse<T>): Promise<{ hash: string; fee: bigint }> {
    if (response instanceof ContractTransactionResponse) {
      const receipt = await response.wait();
      if (receipt?.status === 0) throw Error('Ethers transaction failed');
      if (!receipt) throw Error('Cannot get receipt');
      const { hash, fee, logs } = receipt;

      // TODO: For sponsored transactions, the commission is calculated incorrectly
      // Check refund inside substrate
      // const sponsoringRefund = ...
      return { hash, fee };
    } else {
      const { hash, events, error } = response;
      if (error) throw Error('SDK transaction failed');
      let fee = response.fee?.raw ?? 0;
      if (!fee) {
        let feeEvent = events.find((e) => e.section === 'treasury' && e.method === 'Deposit');
        if (feeEvent) {
          fee = (feeEvent.data as any)[0];
          if (!fee) fee = '0';
        }
      }
      return { hash, fee: BigInt(fee) };
    }
  }
}
