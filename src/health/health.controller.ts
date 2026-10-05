import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from 'src/auth/decorators/public.decorator';

import { PrismaService } from '../prisma/prisma.service';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { RedisService } from 'src/redis/redis.service';
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly health: HealthCheckService,
    private readonly redisService: RedisService,
  ) {}

  @Public()
  @Get()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),

      async () => {
        await this.redisService.ping();
        return {
          redis: {
            status: 'up',
          },
        };
      },
    ]);
  }
}
