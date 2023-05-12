import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { HealthService } from '../health';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health Checker')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  check() {
    return this.health.check();
  }
}
