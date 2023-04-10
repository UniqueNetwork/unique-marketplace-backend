import { ContractEntity } from '@app/common/modules/database';
import { ApiProperty } from '@nestjs/swagger';

export class ContractDto implements ContractEntity {
  @ApiProperty({ example: '0x18d154d9c3b0105bb316dcf0cda67d3360490837' })
  address: string;

  @ApiProperty({ example: 886786 })
  createdAt: number;

  @ApiProperty({ example: 886786 })
  processedAt: number;

  @ApiProperty({ example: 0 })
  version: number;
}
