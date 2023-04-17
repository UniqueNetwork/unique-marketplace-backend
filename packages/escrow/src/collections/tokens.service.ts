import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TokensEntity } from '@app/common/modules/database/entities/tokens.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TokensService {
  private logger: Logger = new Logger(TokensService.name);
  constructor(
    @InjectRepository(TokensEntity)
    private tokensRepository: Repository<TokensEntity>
  ) {}
}
