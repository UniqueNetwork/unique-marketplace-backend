/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from '../../scripts/common-types';

export type CrossAddressStruct = {
  eth: PromiseOrValue<string>;
  sub: PromiseOrValue<BigNumberish>;
};

export type CrossAddressStructOutput = [string, BigNumber] & {
  eth: string;
  sub: BigNumber;
};

export type RoyaltyAmountStruct = {
  crossAddress: CrossAddressStruct;
  amount: PromiseOrValue<BigNumberish>;
};

export type RoyaltyAmountStructOutput = [
  CrossAddressStructOutput,
  BigNumber
] & { crossAddress: CrossAddressStructOutput; amount: BigNumber };

export declare namespace Market {
  export type OrderStruct = {
    id: PromiseOrValue<BigNumberish>;
    collectionId: PromiseOrValue<BigNumberish>;
    tokenId: PromiseOrValue<BigNumberish>;
    amount: PromiseOrValue<BigNumberish>;
    price: PromiseOrValue<BigNumberish>;
    seller: CrossAddressStruct;
  };

  export type OrderStructOutput = [
    number,
    number,
    number,
    number,
    BigNumber,
    CrossAddressStructOutput
  ] & {
    id: number;
    collectionId: number;
    tokenId: number;
    amount: number;
    price: BigNumber;
    seller: CrossAddressStructOutput;
  };
}

export interface MarketInterface extends utils.Interface {
  functions: {
    "addAdmin(address)": FunctionFragment;
    "addToBlacklist(uint32)": FunctionFragment;
    "admins(address)": FunctionFragment;
    "buildVersion()": FunctionFragment;
    "buy(uint32,uint32,uint32,(address,uint256))": FunctionFragment;
    "checkApproved(uint32,uint32)": FunctionFragment;
    "ctime()": FunctionFragment;
    "getOrder(uint32,uint32)": FunctionFragment;
    "marketFee()": FunctionFragment;
    "owner()": FunctionFragment;
    "ownerAddress()": FunctionFragment;
    "put(uint32,uint32,uint256,uint32,(address,uint256))": FunctionFragment;
    "removeAdmin(address)": FunctionFragment;
    "removeFromBlacklist(uint32)": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "revoke(uint32,uint32,uint32)": FunctionFragment;
    "revokeAdmin(uint32,uint32)": FunctionFragment;
    "revokeListAdmin(uint32,uint32[])": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "version()": FunctionFragment;
    "withdraw(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "addAdmin"
      | "addToBlacklist"
      | "admins"
      | "buildVersion"
      | "buy"
      | "checkApproved"
      | "ctime"
      | "getOrder"
      | "marketFee"
      | "owner"
      | "ownerAddress"
      | "put"
      | "removeAdmin"
      | "removeFromBlacklist"
      | "renounceOwnership"
      | "revoke"
      | "revokeAdmin"
      | "revokeListAdmin"
      | "transferOwnership"
      | "version"
      | "withdraw"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "addAdmin",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "addToBlacklist",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "admins",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "buildVersion",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "buy",
    values: [
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      CrossAddressStruct
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "checkApproved",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(functionFragment: "ctime", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "getOrder",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(functionFragment: "marketFee", values?: undefined): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "ownerAddress",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "put",
    values: [
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      CrossAddressStruct
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "removeAdmin",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "removeFromBlacklist",
    values: [PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "revoke",
    values: [
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>,
      PromiseOrValue<BigNumberish>
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeAdmin",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "revokeListAdmin",
    values: [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>[]]
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(functionFragment: "version", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "withdraw",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(functionFragment: "addAdmin", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "addToBlacklist",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "admins", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "buildVersion",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "buy", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "checkApproved",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "ctime", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getOrder", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "marketFee", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "ownerAddress",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "put", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "removeAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "removeFromBlacklist",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "revoke", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "revokeAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "revokeListAdmin",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "version", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {
    "Log(string)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "TokenIsApproved(uint32,tuple)": EventFragment;
    "TokenIsPurchased(uint32,tuple,uint32,tuple,tuple[])": EventFragment;
    "TokenIsUpForSale(uint32,tuple)": EventFragment;
    "TokenRevoke(uint32,tuple,uint32)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Log"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TokenIsApproved"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TokenIsPurchased"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TokenIsUpForSale"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TokenRevoke"): EventFragment;
}

export interface LogEventObject {
  message: string;
}
export type LogEvent = TypedEvent<[string], LogEventObject>;

export type LogEventFilter = TypedEventFilter<LogEvent>;

export interface OwnershipTransferredEventObject {
  previousOwner: string;
  newOwner: string;
}
export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  OwnershipTransferredEventObject
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface TokenIsApprovedEventObject {
  version: number;
  item: Market.OrderStructOutput;
}
export type TokenIsApprovedEvent = TypedEvent<
  [number, Market.OrderStructOutput],
  TokenIsApprovedEventObject
>;

export type TokenIsApprovedEventFilter = TypedEventFilter<TokenIsApprovedEvent>;

export interface TokenIsPurchasedEventObject {
  version: number;
  item: Market.OrderStructOutput;
  salesAmount: number;
  buyer: CrossAddressStructOutput;
  royalties: RoyaltyAmountStructOutput[];
}
export type TokenIsPurchasedEvent = TypedEvent<
  [
    number,
    Market.OrderStructOutput,
    number,
    CrossAddressStructOutput,
    RoyaltyAmountStructOutput[]
  ],
  TokenIsPurchasedEventObject
>;

export type TokenIsPurchasedEventFilter =
  TypedEventFilter<TokenIsPurchasedEvent>;

export interface TokenIsUpForSaleEventObject {
  version: number;
  item: Market.OrderStructOutput;
}
export type TokenIsUpForSaleEvent = TypedEvent<
  [number, Market.OrderStructOutput],
  TokenIsUpForSaleEventObject
>;

export type TokenIsUpForSaleEventFilter =
  TypedEventFilter<TokenIsUpForSaleEvent>;

export interface TokenRevokeEventObject {
  version: number;
  item: Market.OrderStructOutput;
  amount: number;
}
export type TokenRevokeEvent = TypedEvent<
  [number, Market.OrderStructOutput, number],
  TokenRevokeEventObject
>;

export type TokenRevokeEventFilter = TypedEventFilter<TokenRevokeEvent>;

export interface Market extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: MarketInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    addAdmin(
      admin: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    addToBlacklist(
      collectionId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    admins(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[boolean]>;

    buildVersion(overrides?: CallOverrides): Promise<[number]>;

    buy(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      amount: PromiseOrValue<BigNumberish>,
      buyer: CrossAddressStruct,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    checkApproved(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    ctime(overrides?: CallOverrides): Promise<[BigNumber]>;

    getOrder(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[Market.OrderStructOutput]>;

    marketFee(overrides?: CallOverrides): Promise<[number]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    ownerAddress(overrides?: CallOverrides): Promise<[string]>;

    put(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      price: PromiseOrValue<BigNumberish>,
      amount: PromiseOrValue<BigNumberish>,
      seller: CrossAddressStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    removeAdmin(
      admin: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    removeFromBlacklist(
      collectionId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    revoke(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    revokeAdmin(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    revokeListAdmin(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenIdList: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    version(overrides?: CallOverrides): Promise<[number]>;

    withdraw(
      transferTo: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  addAdmin(
    admin: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  addToBlacklist(
    collectionId: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  admins(
    arg0: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<boolean>;

  buildVersion(overrides?: CallOverrides): Promise<number>;

  buy(
    collectionId: PromiseOrValue<BigNumberish>,
    tokenId: PromiseOrValue<BigNumberish>,
    amount: PromiseOrValue<BigNumberish>,
    buyer: CrossAddressStruct,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  checkApproved(
    collectionId: PromiseOrValue<BigNumberish>,
    tokenId: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  ctime(overrides?: CallOverrides): Promise<BigNumber>;

  getOrder(
    collectionId: PromiseOrValue<BigNumberish>,
    tokenId: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<Market.OrderStructOutput>;

  marketFee(overrides?: CallOverrides): Promise<number>;

  owner(overrides?: CallOverrides): Promise<string>;

  ownerAddress(overrides?: CallOverrides): Promise<string>;

  put(
    collectionId: PromiseOrValue<BigNumberish>,
    tokenId: PromiseOrValue<BigNumberish>,
    price: PromiseOrValue<BigNumberish>,
    amount: PromiseOrValue<BigNumberish>,
    seller: CrossAddressStruct,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  removeAdmin(
    admin: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  removeFromBlacklist(
    collectionId: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  renounceOwnership(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  revoke(
    collectionId: PromiseOrValue<BigNumberish>,
    tokenId: PromiseOrValue<BigNumberish>,
    amount: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  revokeAdmin(
    collectionId: PromiseOrValue<BigNumberish>,
    tokenId: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  revokeListAdmin(
    collectionId: PromiseOrValue<BigNumberish>,
    tokenIdList: PromiseOrValue<BigNumberish>[],
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  version(overrides?: CallOverrides): Promise<number>;

  withdraw(
    transferTo: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    addAdmin(
      admin: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    addToBlacklist(
      collectionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    admins(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<boolean>;

    buildVersion(overrides?: CallOverrides): Promise<number>;

    buy(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      amount: PromiseOrValue<BigNumberish>,
      buyer: CrossAddressStruct,
      overrides?: CallOverrides
    ): Promise<void>;

    checkApproved(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    ctime(overrides?: CallOverrides): Promise<BigNumber>;

    getOrder(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<Market.OrderStructOutput>;

    marketFee(overrides?: CallOverrides): Promise<number>;

    owner(overrides?: CallOverrides): Promise<string>;

    ownerAddress(overrides?: CallOverrides): Promise<string>;

    put(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      price: PromiseOrValue<BigNumberish>,
      amount: PromiseOrValue<BigNumberish>,
      seller: CrossAddressStruct,
      overrides?: CallOverrides
    ): Promise<void>;

    removeAdmin(
      admin: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    removeFromBlacklist(
      collectionId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    revoke(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    revokeAdmin(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    revokeListAdmin(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenIdList: PromiseOrValue<BigNumberish>[],
      overrides?: CallOverrides
    ): Promise<void>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;

    version(overrides?: CallOverrides): Promise<number>;

    withdraw(
      transferTo: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "Log(string)"(message?: null): LogEventFilter;
    Log(message?: null): LogEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: PromiseOrValue<string> | null,
      newOwner?: PromiseOrValue<string> | null
    ): OwnershipTransferredEventFilter;

    "TokenIsApproved(uint32,tuple)"(
      version?: null,
      item?: null
    ): TokenIsApprovedEventFilter;
    TokenIsApproved(version?: null, item?: null): TokenIsApprovedEventFilter;

    "TokenIsPurchased(uint32,tuple,uint32,tuple,tuple[])"(
      version?: null,
      item?: null,
      salesAmount?: null,
      buyer?: null,
      royalties?: null
    ): TokenIsPurchasedEventFilter;
    TokenIsPurchased(
      version?: null,
      item?: null,
      salesAmount?: null,
      buyer?: null,
      royalties?: null
    ): TokenIsPurchasedEventFilter;

    "TokenIsUpForSale(uint32,tuple)"(
      version?: null,
      item?: null
    ): TokenIsUpForSaleEventFilter;
    TokenIsUpForSale(version?: null, item?: null): TokenIsUpForSaleEventFilter;

    "TokenRevoke(uint32,tuple,uint32)"(
      version?: null,
      item?: null,
      amount?: null
    ): TokenRevokeEventFilter;
    TokenRevoke(
      version?: null,
      item?: null,
      amount?: null
    ): TokenRevokeEventFilter;
  };

  estimateGas: {
    addAdmin(
      admin: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    addToBlacklist(
      collectionId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    admins(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    buildVersion(overrides?: CallOverrides): Promise<BigNumber>;

    buy(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      amount: PromiseOrValue<BigNumberish>,
      buyer: CrossAddressStruct,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    checkApproved(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    ctime(overrides?: CallOverrides): Promise<BigNumber>;

    getOrder(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    marketFee(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    ownerAddress(overrides?: CallOverrides): Promise<BigNumber>;

    put(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      price: PromiseOrValue<BigNumberish>,
      amount: PromiseOrValue<BigNumberish>,
      seller: CrossAddressStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    removeAdmin(
      admin: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    removeFromBlacklist(
      collectionId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    revoke(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    revokeAdmin(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    revokeListAdmin(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenIdList: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    version(overrides?: CallOverrides): Promise<BigNumber>;

    withdraw(
      transferTo: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    addAdmin(
      admin: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    addToBlacklist(
      collectionId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    admins(
      arg0: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    buildVersion(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    buy(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      amount: PromiseOrValue<BigNumberish>,
      buyer: CrossAddressStruct,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    checkApproved(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    ctime(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getOrder(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    marketFee(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ownerAddress(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    put(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      price: PromiseOrValue<BigNumberish>,
      amount: PromiseOrValue<BigNumberish>,
      seller: CrossAddressStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    removeAdmin(
      admin: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    removeFromBlacklist(
      collectionId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    revoke(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      amount: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    revokeAdmin(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenId: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    revokeListAdmin(
      collectionId: PromiseOrValue<BigNumberish>,
      tokenIdList: PromiseOrValue<BigNumberish>[],
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    version(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    withdraw(
      transferTo: PromiseOrValue<string>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}


export type MarketEventNames = "OwnershipTransferred" | "TokenIsApproved" | "TokenIsPurchased" | "TokenIsUpForSale" | "TokenRevoke";
