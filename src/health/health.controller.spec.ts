import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { RedisService } from 'src/redis/redis.service';

jest.mock('@nestjs/terminus', () => ({
  HealthCheckService: jest.fn(),
  PrismaHealthIndicator: jest.fn(),
}));

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: PrismaHealthIndicator,
          useValue: {
            pingCheck: jest
              .fn()
              .mockResolvedValue({ database: { status: 'up' } }),
          },
        },
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn().mockImplementation(async (checks) => {
              const results = await Promise.all(
                checks.map((fn: () => any) => fn()),
              );
              return { status: 'ok', info: results };
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            ping: jest.fn().mockResolvedValue('PONG'),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get(HealthCheckService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should run health checks for database and redis', async () => {
    const result = await controller.check();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(healthCheckService.check).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: 'ok',
      info: [{ database: { status: 'up' } }, { redis: { status: 'up' } }],
    });
  });
});
