import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from 'src/auth/decorators/public.decorator';

@SkipThrottle()
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'The server is running :) ' };
  }
}
