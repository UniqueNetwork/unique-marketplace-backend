import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Controller, Get, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { Response } from 'express';
import { PrometheusHealthService } from '../health';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Prometheus metrics')
@Controller({ path: 'metrics', version: VERSION_NEUTRAL })
export class MetricsController extends PrometheusController {
  constructor(private prometheusHealthService: PrometheusHealthService) {
    super();
  }

  @Get()
  async index(@Res() response: Response): Promise<string> {
    await this.prometheusHealthService.refresh();

    return await super.index(response);
  }
}
