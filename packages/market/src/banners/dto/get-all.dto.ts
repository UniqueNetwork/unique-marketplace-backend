import { OffFilter } from '../types';
import { ApiProperty } from '@nestjs/swagger';

export class GetAllDto {
  @ApiProperty({ required: false, enum: OffFilter, default: OffFilter.All })
  offFilter?: OffFilter;
}
