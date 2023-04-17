import { Injectable } from '@nestjs/common';
import { CreateTokenDto } from './dto/create-token.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TokensEntity } from '@app/common/modules/database/entities/tokens.entity';
import { Repository } from 'typeorm';
import { IPaginationOptions, paginate } from 'nestjs-typeorm-paginate';
import { CollectionEntity } from '@app/common/modules/database';

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(TokensEntity)
    private tokenRepository: Repository<TokensEntity>
  ) {}

  async findAll(options: IPaginationOptions): Promise<any> {
    const qb = await this.tokenRepository.createQueryBuilder();
    const { items, meta } = await paginate(qb, options);
    return {
      meta,
      items,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} token`;
  }

  update(id: number, updateTokenDto: UpdateTokenDto) {
    return `This action updates a #${id} token`;
  }

  remove(id: number) {
    return `This action removes a #${id} token`;
  }
}
