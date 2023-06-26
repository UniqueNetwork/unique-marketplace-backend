import { Injectable } from '@nestjs/common';
import { WorkerService } from 'nestjs-graphile-worker';
import { TaskSpec } from 'graphile-worker';
import { getJobName, JOB_HIGH_PRIORITY, JOB_LOW_PRIORITY } from './utils';
import { InjectRepository } from '@nestjs/typeorm';
import { OfferEntity } from '@app/common/modules/database';
import { Repository } from 'typeorm';

@Injectable()
export class GraphileService {
  constructor(
    private readonly graphileWorker: WorkerService,
    @InjectRepository(OfferEntity)
    private offersRepository: Repository<OfferEntity>,
  ) {}

  public async addToken(collectionId: number, tokenId: number, network: string, checkPriority: boolean) {
    const hasOffer = checkPriority
      ? await this.offersRepository.findOne({
          where: {
            collectionId,
            tokenId,
          },
        })
      : null;

    const jobName = getJobName(collectionId, tokenId);

    const taskSpec: TaskSpec = {
      priority: hasOffer ? JOB_HIGH_PRIORITY : JOB_LOW_PRIORITY,
      queueName: jobName,
      jobKeyMode: 'replace',
    };

    await this.graphileWorker.addJob(
      'collectTokens',
      {
        tokenId,
        collectionId,
        network,
      },
      {
        ...taskSpec,
        jobKey: `collectTokens_${jobName}`,
      },
    );

    await this.graphileWorker.addJob(
      'collectProperties',
      {
        tokenId,
        collectionId,
        network,
      },
      {
        ...taskSpec,
        jobKey: `collectProperties_${jobName}`,
      },
    );
  }
}
