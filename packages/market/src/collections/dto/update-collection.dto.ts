import { PartialType } from '@nestjs/mapped-types';
import { CollectionDto } from './create-collection.dto';
import { PickType } from '@nestjs/swagger';

export class UpdateCollectionDto extends PartialType(CollectionDto) {}
export class UpdateCollectionStatusDto extends PickType(CollectionDto, [
  'collectionId',
  'status',
] as const) {}
