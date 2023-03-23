import { MigrationInterface, QueryRunner } from 'typeorm';
import { loadConfig } from '../../../config';
import { deploy } from '../../../../../contracts/scripts';
import { ContractEntity } from '../../entities/contract.entity';

export abstract class DeployContractBase implements MigrationInterface {
  public abstract readonly version: number;
  public abstract readonly feeValue: number;

  public async up(queryRunner: QueryRunner): Promise<any> {
    const config = loadConfig();

    const { contractAddress, blockNumber } = await deploy(
      this.version,
      this.feeValue,
      config.uniqueRpcUrl,
      config.signer.seed
    );

    const repository = queryRunner.connection.getRepository(ContractEntity);
    const contractEntity = repository.create();
    contractEntity.address = contractAddress.toLowerCase();
    contractEntity.createdAt = blockNumber;
    contractEntity.processedAt = blockNumber;
    contractEntity.version = this.version;
    await repository.save(contractEntity);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // empty this
  }
}
