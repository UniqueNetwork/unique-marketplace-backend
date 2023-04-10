import { ContractEntity, OfferEntity } from '@app/common/modules/database';
import { OfferStatus } from '@app/common/modules/types';
import { ApiProperty } from '@nestjs/swagger';
import { ContractDto } from './contract.dto';

export class OffersDto {
  @ApiProperty({ example: 200 })
  orderId: number;

  @ApiProperty({ example: 1 })
  amount: number;

  @ApiProperty({ example: 101 })
  collectionId: number;

  @ApiProperty({ example: 15 })
  tokenId: number;

  @ApiProperty({ example: ContractDto })
  contract: ContractDto;

  @ApiProperty({ example: 1_000_000_000_000_000_000 })
  price: bigint;

  @ApiProperty({ example: '5GeoRAcsvhZoFz77H9SqT3Umu5uPcLZEqppN6ixohEY3nKEX' })
  seller: string;

  @ApiProperty({ example: OfferStatus.Opened })
  status: OfferStatus;
}
