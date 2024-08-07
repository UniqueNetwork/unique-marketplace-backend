import { ApiProperty } from '@nestjs/swagger';
import { ContractEntity } from '@app/common/modules/database';
import { CurrencyDto } from '../../contracts/dto/set-currencies.dto';

export interface CollectionData {
  [key: string]: string | any;
}

const ContractExample = {
  address: '',
  version: '',
  createdAt: '',
  processedAt: '',
};

export class SettingBlockchainUnique {
  @ApiProperty({})
  restUrl: string;
  @ApiProperty({})
  rpcUrl: string;

  @ApiProperty({ example: { 10: { allowedTokens: ['2,4,10-30,50-100,122'] } } })
  collections: CollectionData | null;

  @ApiProperty({ example: [ContractExample] })
  contracts: ContractEntity[];

  @ApiProperty({ type: CurrencyDto, isArray: true })
  currencies: CurrencyDto[];
}

export class SettingBlockchain {
  @ApiProperty({})
  unique: SettingBlockchainUnique;
}
