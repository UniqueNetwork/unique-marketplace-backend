import { Controller, Logger } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('collections')
export class CollectionsController {
  public logger: Logger = new Logger('EventEscrowCollection');
  constructor(private readonly collectionsService: CollectionsService) {}
  @EventPattern('new-collection-added')
  async onAddCollection(@Payload() data: { collectionId: number }) {
    await this.collectionsService.addNewCollection(data);
    this.logger.debug(data);
  }
}
