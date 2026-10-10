import { Controller, Get, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from 'src/auth/decorators/public.decorator';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import type { Response } from 'express';

@SkipThrottle()
@Controller('metrics')
export class MetricsController extends PrometheusController {
  @Public()
  @Get()
  async index(@Res({ passthrough: true }) response: Response) {
    return super.index(response);
  }
}
