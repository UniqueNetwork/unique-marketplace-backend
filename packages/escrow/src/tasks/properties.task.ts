import { Injectable, Logger } from '@nestjs/common';
import { Task, TaskHandler } from 'nestjs-graphile-worker';
import { SdkService } from '../app/sdk.service';
import { InjectRepository } from '@nestjs/typeorm';
import { TokensEntity } from '@app/common/modules/database/entities/tokens.entity';
import { Repository } from 'typeorm';
import { Helpers } from 'graphile-worker';

@Injectable()
@Task('collectProperties')
export class PropertiesTask {
  private logger = new Logger(PropertiesTask.name);

  constructor(
    private sdkService: SdkService,
    @InjectRepository(TokensEntity)
    private tokensRepository: Repository<TokensEntity>
  ) {}

  /**
   * Properties Task Handler
   * @description Incoming data handler. Processes data on the `collectProperties` event
   * @param {Object} payload - input data
   * @param helpers
   */
  @TaskHandler()
  async handler(payload: any, helpers: Helpers): Promise<void> {}
}
