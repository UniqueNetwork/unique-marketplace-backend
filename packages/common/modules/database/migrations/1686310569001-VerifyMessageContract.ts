import { MigrationInterface, QueryRunner } from 'typeorm';
import { loadConfig } from '../../config';
import { verifyMessageDeploy } from '../../../../contracts/scripts';
import { SettingEntity } from '../entities';

export abstract class VerifyMessageContract1686310569001 implements MigrationInterface {
  name: 'VerifyMessageContract1686310569001';

  public async up(queryRunner: QueryRunner): Promise<any> {
    const config = loadConfig();
    const { contractAddress, blockNumber } = await verifyMessageDeploy(
      config.uniqueRpcUrl,
      config.signer.metamaskSeed,
      config.signer.substrateSeed,
    );

    const repository = queryRunner.connection.getRepository(SettingEntity);
    const contractEntity = repository.create();
    contractEntity.value = contractAddress.toLowerCase();
    contractEntity.key = 'contract_metamask_address';
    await repository.save(contractEntity);
    const contractEntityBlock = repository.create();
    contractEntityBlock.value = `${blockNumber}`;
    contractEntityBlock.key = 'contract_metamask_block';
    await repository.save(contractEntityBlock);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // empty this
  }
}
