import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  EMAIL_QUEUE,
  SEND_OTP_JOB,
  SEND_RESET_PASSWORD_JOB,
} from './email.constants';

@Injectable()
export class EmailService {
  constructor(@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue) {}
  async sendOtp(email: string, otp: string, fullname: string) {
    await this.emailQueue.add(
      SEND_OTP_JOB,
      { email, otp, fullname },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  async sendResetPassword(email: string, otp: string, fullname: string) {
    await this.emailQueue.add(
      SEND_RESET_PASSWORD_JOB,
      { email, otp, fullname },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
