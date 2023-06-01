import { ApiProperty } from '@nestjs/swagger';

export class CheckApprovedDto {
  @ApiProperty()
  contractAddress: string;

  @ApiProperty()
  collectionId: number;

  @ApiProperty()
  tokenId: number;
}
