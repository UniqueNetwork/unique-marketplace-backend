import { Injectable } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: 'Welcome to escrow!' };
  }
}
