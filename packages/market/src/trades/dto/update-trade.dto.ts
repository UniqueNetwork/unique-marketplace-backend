import { PartialType } from '@nestjs/mapped-types';
import { CreateTradeDto } from './create-trade.dto';

export class UpdateTradeDto extends PartialType(CreateTradeDto) {}
