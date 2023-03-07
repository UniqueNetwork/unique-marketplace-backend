import { MigrationInterface, QueryRunner, Repository } from 'typeorm';
import { SettingEntity } from '../../entities/setting.entity';
import { loadConfig } from '../../../config';
import { deployContractByWeb3 } from '../../../../../contracts/scripts';

export abstract class DeployContractBase implements MigrationInterface {
  public abstract readonly version: number;

  public async up(queryRunner: QueryRunner): Promise<any> {
    const config = loadConfig();

    const contractAddress = await deployContractByWeb3(
      this.version,
      config.uniqueRpcUrl,
      config.signer.seed
    );

    const repository = queryRunner.connection.getRepository(SettingEntity);
    await this.updateSettings(repository, 'contractAddress', contractAddress);
    await this.updateSettings(repository, 'contractVersion', `${this.version}`);
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
