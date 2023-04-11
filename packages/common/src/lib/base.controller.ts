import { ConfigService } from '@nestjs/config';

export class BaseController {
  constructor(private configService: ConfigService) {}
}
