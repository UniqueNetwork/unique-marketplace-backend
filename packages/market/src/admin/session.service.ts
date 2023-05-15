import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminSessionEntity } from '@app/common/modules/database/entities/admin-sessions.entity';
import { Repository } from 'typeorm';
import { SdkMarketService } from '../sdk/sdk.service';

@Injectable()
export class SessionService {
  private logger: Logger = new Logger(SessionService.name);

  constructor(
    private sdkMarketService: SdkMarketService,
    @InjectRepository(AdminSessionEntity) private adminRepository: Repository<AdminSessionEntity>,
  ) {}

  async saveSessions(account: string, collectionId: number, metadata?: any): Promise<void> {
    const sessionId = await this.adminRepository.create({
      address: account,
      substrate_address: account,
      collection_id: collectionId,
      metadata,
    });
    console.dir(sessionId, { depth: 10 });
    await this.adminRepository.save(sessionId);
  }
}
