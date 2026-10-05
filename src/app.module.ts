import { PrismaModule } from '@lib/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { envValidationSchema } from './config/env.validation';
import { EmailModule } from './email/email.module';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { HealthController } from './health/health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { RedisService } from './redis/redis.service';
import { RedisModule } from './redis/redis.module';
@Module({
  imports: [
    TerminusModule,
    RedisModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL },
    }),
    PrismaModule,
    AuthModule,
    EmailModule,
    RedisModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    RedisService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*path');
  }
}
