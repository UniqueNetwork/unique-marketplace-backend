import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractEntity, OfferService } from '@app/common/modules/database';
import { Sdk } from '@unique-nft/sdk/full';
import { Address } from '@unique-nft/utils';
import { CheckApprovedDto } from './dto/check-approved.dto';
import { getContractAbi } from '@app/contracts/scripts';
import { Market } from '@app/contracts/assemblies/0/market';
import { OfferStatus } from '@app/common/modules/types';

interface ContractEventValue {
  item: Market.OrderStructOutput;
}

@Injectable()
export class ContractsService {
  private logger: Logger = new Logger(ContractsService.name);

  constructor(
    private readonly sdk: Sdk,
    @InjectRepository(ContractEntity)
    private contractService: Repository<ContractEntity>,
    private offerService: OfferService,
  ) {}

  public async checkApproved(params: CheckApprovedDto) {
    this.logger.log('check-approved', params);
    const { contractAddress, collectionId, tokenId } = params;

    const contractEntity = await this.contractService.findOne({
      where: {
        address: contractAddress,
      },
    });
    if (!contractEntity) {
      this.logger.log(`Contract ${contractAddress} not found`);
      return {
        errorMessage: 'Contract not found',
      };
    }

    const abi = getContractAbi(contractEntity.version);

    const contract = await this.sdk.evm.contractConnect(contractAddress, abi);

    const callArgs = {
      address: this.sdk.options.signer.address,
      funcName: 'checkApproved',
      args: {
        collectionId,
        tokenId,
      },
    };
    try {
      await contract.call(callArgs);
    } catch (err) {
      this.logger.log(`Contract call error: [${err.name}] ${err.message}`, err.details);
      return {
        errorMessage: err.message,
      };
    }

    const result = await contract.send.submitWaitResult(callArgs);

    if (!result.parsed && !result.parsed.parsedEvents.length) {
      this.logger.log(`execute failed`, result);
      return {
        errorMessage: 'execute failed',
      };
    }

    const { name, values } = result.parsed.parsedEvents[0];
    const eventObject = values as ContractEventValue;

    const sellerIsOwner = await this.sellerIsOwner(collectionId, tokenId, eventObject);

    if (name === 'TokenRevoke' || !sellerIsOwner) {
      await this.offerService.update(contractEntity, eventObject.item, OfferStatus.Canceled);
    } else if (name === 'TokenIsApproved') {
      await this.offerService.update(contractEntity, eventObject.item, OfferStatus.Opened);
    }

    this.logger.log(`check-approved result:`, result.parsed);

    return {
      result: eventObject,
    };
  }

  private async sellerIsOwner(collectionId, tokenId, eventObject: ContractEventValue): Promise<boolean> {
    const ownerResult = await this.sdk.token.owner({
      collectionId,
      tokenId,
    });

    const owner = ownerResult.owner.toLowerCase();

    const { seller } = eventObject.item;

    const sellerNormalized = Address.extract.addressNormalized(seller).toLowerCase();

    return sellerNormalized === owner;
  }
}
