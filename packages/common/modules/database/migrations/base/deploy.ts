import { MigrationInterface, QueryRunner, Repository } from 'typeorm';
import { SettingEntity } from '../../entities/setting.entity';
import * as fs from 'fs/promises';
import { ethers } from 'ethers';
import { loadConfig } from '../../../config';

export abstract class DeployContractBase implements MigrationInterface {
  private readonly assembliesBasePath = './packages/contracts/assemblies';

  public abstract readonly version: string;

  public async up(queryRunner: QueryRunner): Promise<any> {
    const contractAddress = await this.deploy();

    const repository = queryRunner.connection.getRepository(SettingEntity);
    await this.updateSettings(repository, 'contractAddress', contractAddress);
    await this.updateSettings(repository, 'contractVersion', this.version);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    // empty this
  }

  private async deploy(): Promise<string> {
    const versionDir = `${this.assembliesBasePath}/${this.version}`;
    const abiFilename = `${versionDir}/abi.json`;
    const bytecodeFilename = `${versionDir}/bytecode.txt`;

    const config = loadConfig();
    const provider = ethers.getDefaultProvider(config.uniqueRpcUrl);
    const signer = new ethers.Wallet(config.walletPrivateKey, provider);

    const abi = JSON.parse((await fs.readFile(abiFilename)).toString());
    const bytecode = (await fs.readFile(bytecodeFilename)).toString();

    const MarketFactory = new ethers.ContractFactory(abi, bytecode, signer);

    const market = await MarketFactory.deploy(10, {
      gasLimit: 1000000,
    });

    const { target } = await market.waitForDeployment();

    return target as string;
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
