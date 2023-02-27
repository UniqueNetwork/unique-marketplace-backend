import { Injectable } from '@nestjs/common';
import { Client } from "@unique-nft/sdk";
import { Repository } from "typeorm";
import { SettingEntity } from "@app/common/modules/database/entities/setting.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class AppService {

  constructor(
    private sdk: Client,
    @InjectRepository(SettingEntity) private settingEntityRepository: Repository<SettingEntity>,
  ) {
    this.sdk.common.chainProperties().then(console.log);
    this.settingEntityRepository.findOne({ where: { key: 'contract_id' }}).then(console.log);
  }

  getData(): { message: string } {
    return { message: 'Welcome to escrow!' };
  }
}
