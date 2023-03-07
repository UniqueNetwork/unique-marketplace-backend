import { MigrationInterface, QueryRunner, Repository } from 'typeorm';
import { SettingEntity } from '../../entities/setting.entity';
import { loadConfig } from '../../../config';
import { deploy } from '../../../../../contracts/scripts';

export abstract class DeployContractBase implements MigrationInterface {
  public abstract readonly version: number;
  public abstract readonly feeValue: number;

  public async up(queryRunner: QueryRunner): Promise<any> {
    const config = loadConfig();

    const contractAddress = await deploy(
      this.version,
      this.feeValue,
      config.uniqueRpcUrl,
      config.signer.seed
    );

    const repository = queryRunner.connection.getRepository(SettingEntity);
    await this.updateSettings(
      repository,
      `contract_v${this.version}`,
      contractAddress
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // empty this
  }

  private async updateSettings(
    repository: Repository<SettingEntity>,
    key: string,
    value: string
  ) {
    let settingEntity = await repository.findOne({
      where: {
        key,
      },
    });

    if (settingEntity) {
      settingEntity.value = value;
    } else {
      settingEntity = repository.create();
      settingEntity.key = key;
      settingEntity.value = value;
    }

    await repository.save(settingEntity);
  }
}
