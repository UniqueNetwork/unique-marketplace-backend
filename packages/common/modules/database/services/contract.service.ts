import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContractEntity } from '../entities/contract.entity';
import { LessThan, Repository } from 'typeorm';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(ContractEntity)
    private contractEntityRepository: Repository<ContractEntity>
  ) {}

  public getAll(): Promise<ContractEntity[]> {
    return this.contractEntityRepository.find();
  }

  async getProcessedBlock(address: string): Promise<number> {
    const entity = await this.contractEntityRepository.findOne({
      where: {
        address,
      },
    });
    return entity?.processedAt || 0;
  }

  async updateProcessedBlock(address: string, processedAt: number) {
    await this.contractEntityRepository.update(
      {
        address,
        processedAt: LessThan(processedAt),
      },
      {
        processedAt,
      }
    );
  }
}
