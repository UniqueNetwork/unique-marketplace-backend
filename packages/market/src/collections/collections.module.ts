import { forwardRef, Module } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';
import { PgNotifyClientModule } from '@app/common/pg-transport/pg-notify-client.module';

@Module({
  imports: [forwardRef(() => PgNotifyClientModule)],
  controllers: [CollectionsController],
  providers: [CollectionsService],
})
export class CollectionsModule {}
