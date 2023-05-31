import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { ContractEntity } from '../entities';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(ContractEntity)
    private contractEntityRepository: Repository<ContractEntity>,
  ) {}

  public get(address: string): Promise<ContractEntity | null> {
    return this.contractEntityRepository.findOne({
      where: {
        address,
      },
    });
  }

  public getAll(): Promise<ContractEntity[]> {
    return this.contractEntityRepository.find({
      where: {
        version: MoreThanOrEqual(0),
      },
    });
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
      },
    );
  }
}
