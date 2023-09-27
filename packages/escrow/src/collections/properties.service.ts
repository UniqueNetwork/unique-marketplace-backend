import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PropertiesEntity } from '@app/common/modules/database/entities/properties.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(PropertiesEntity)
    private propertiesRepository: Repository<PropertiesEntity>
  ) {}
}
