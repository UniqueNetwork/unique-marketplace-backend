import { Controller, Logger } from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PayLoadCollection } from '@app/common/modules/types';

@Controller('collections')
export class CollectionsController {
  public logger: Logger = new Logger('EventEscrowCollection');
  constructor(private readonly collectionsService: CollectionsService) {}

  /**
   * Receive an event with data to add a collection and all its tokens
   * @param data
   */
  @EventPattern('new-collection-added')
  async onAddCollection(@Payload() data: PayLoadCollection) {
    await this.collectionsService.addNewCollection(data);
  }
}
