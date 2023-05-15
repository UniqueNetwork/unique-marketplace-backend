import { Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';

@Module({
  controllers: [TradesController],
  providers: [TradesService]
})
export class TradesModule {}
