import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Sdk } from '@unique-nft/sdk/full';
import { ResponseTokenSchema } from '../../../escrow/src/app/sdk.service';
import Web3 from 'web3';
import { abiVerifyMessage } from '@app/contracts/scripts';
import { ethers } from 'ethers';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingEntity } from '@app/common/modules/database';
import { Repository } from 'typeorm';

@Injectable()
export class SdkMarketService {
  constructor(private readonly sdk: Sdk, @InjectRepository(SettingEntity) private settingRepository: Repository<SettingEntity>) {}

  async checkCollectionOwner(owner: string, collectionId: number): Promise<boolean> {
    let collection;

    try {
      collection = await this.sdk.collections.get({ collectionId });
    } catch (err) {
      throw new NotFoundException(`You are trying to add a collection ${collection} which does not exist!`);
    }
    if (collection.owner === owner) {
      return true;
    }
    throw new BadRequestException('The collection does not belong to you and you cannot put it up for sale!');
  }

  async getListTokensCollection(collectionId: string): Promise<any> {
    const token: ResponseTokenSchema = await this.sdk.stateQuery.execute(
      { endpoint: 'rpc', module: 'unique', method: 'collectionTokens' },
      { args: [collectionId] },
    );
    const list = token.json.sort((a, b) => a - b);

    return {
      list,
    };
  }

  async getTokensCollection(collectionId: number): Promise<any> {
    const token: ResponseTokenSchema = await this.sdk.stateQuery.execute(
      { endpoint: 'rpc', module: 'unique', method: 'collectionTokens' },
      { args: [String(collectionId)] },
    );
    const list = token.json.sort((a, b) => a - b);

    return {
      ...token,
      list,
    };
  }

  async verifyMessageData(signature: string, addressMetamask: string): Promise<boolean> {
    const contractAddress = await this.settingRepository.findOne({ where: { key: 'contract_metamask_address' } });
    const contract = await this.sdk.evm.contractConnect(contractAddress.value, abiVerifyMessage);
    const payload = JSON.parse(atob(signature)) as { signature: string; message: string; metamask: string };

    const r = payload.signature.slice(0, 66);
    const s = '0x' + payload.signature.slice(66, 130);
    const v = parseInt(payload.signature.slice(130, 132), 16);

    const callArgs = {
      funcName: 'VerifyMessage',
      address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
      args: {
        _hashedMessage: payload.message,
        _v: v,
        _r: r,
        _s: s,
      },
    };

    try {
      const result = await contract.call(callArgs);
      if (result.toString() === payload.metamask && result.toString() === addressMetamask) {
        return true;
      }
    } catch (err) {
      throw new BadRequestException(err);
    }
  }
}
