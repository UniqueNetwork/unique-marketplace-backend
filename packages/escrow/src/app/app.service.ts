import { Injectable } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Welcome to escrow!' };
  }

  @EventPattern('new-collection-added')
  async onAddCollection(data: { collectionId: number }) {
    // await this.collectionsService.addNewCollection(data);
    console.dir(data, { depth: 10 });
  }
}
