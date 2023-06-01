import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractEntity } from '@app/common/modules/database';
import { Sdk } from '@unique-nft/sdk/full';
import { CheckApprovedDto } from './dto/check-approved.dto';
import { getContractAbi } from '@app/contracts/scripts';

@Injectable()
export class ContractsService {
  private logger: Logger = new Logger(ContractsService.name);

  constructor(
    private readonly sdk: Sdk,
    @InjectRepository(ContractEntity)
    private contractService: Repository<ContractEntity>,
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

    this.logger.log(`check-approved result:`, result);

    return {
      result: result.parsed.parsedEvents[0],
    };
  }
}
