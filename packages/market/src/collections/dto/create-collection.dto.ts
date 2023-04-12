import { CollectionMode, CollectionStatus } from '@app/common/modules/types';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { Pagination } from 'nestjs-typeorm-paginate';
import { CollectionEntity } from '@app/common/modules/database';
import { Collection } from 'typeorm';

export class CollectionDto {
  @ApiProperty({ example: 5 })
  collectionId: number;

  @ApiProperty({ example: '2,7,10-100,300-400,1000', default: '' })
  allowedTokens: string;

  @ApiProperty({})
  mode?: CollectionMode;

  @ApiProperty({})
  name?: string;
  @ApiProperty({})
  decimalPoints?: number;
  @ApiProperty({})
  description?: string;

  @ApiProperty({})
  mintMode?: boolean;

  @ApiProperty({})
  network?: string;

  @ApiProperty({})
  owner?: string;

  @ApiProperty({})
  tokenPrefix?: string;

  @ApiProperty({ default: CollectionStatus.Enabled })
  status?: CollectionStatus;

  @ApiProperty({})
  data?: string;
}

export class CreateCollectionDto extends PickType(CollectionDto, [
  'collectionId',
  'allowedTokens',
] as const) {}

export class PaginateCollectionDto {
  @ApiProperty({ isArray: true, example: [CollectionDto] })
  items: CollectionDto[];
  @ApiProperty({})
  metadata: string;
}
