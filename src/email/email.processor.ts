import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import {
  EMAIL_QUEUE,
  SEND_OTP_JOB,
  SEND_RESET_PASSWORD_JOB,
} from './email.constants';
import {
  otpEmailTemplate,
  passwordResetEmailTemplate,
} from './templates/email.templates';

@Processor(EMAIL_QUEUE, { lockDuration: 60000 })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT!),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async process(job: Job) {
    this.logger.log(`Processing job: ${job.name} [id: ${job.id}]`);

    switch (job.name) {
      case SEND_OTP_JOB:
        await this.handleSendOtpJob(job);
        break;

      case SEND_RESET_PASSWORD_JOB:
        await this.handleResetPasswordJob(job);
        break;

      default:
        this.logger.warn('Unknown job type: ' + job.name);
    }
  }

  private async handleSendOtpJob(
    job: Job<{ email: string; otp: string; fullname: string }>,
  ) {
    const { email, otp, fullname } = job.data;

    try {
      await this.transporter.sendMail({
        from: `"No Reply" <${process.env.MAIL_FROM}>`,
        to: email,
        subject: 'Your OTP Code',
        html: otpEmailTemplate({
          to: email,
          title: 'Your OTP Code',
          userName: fullname,
          otpCode: otp,
          expiresInMinutes: 10,
        }),
      });

      this.logger.log(`OTP email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw error;
    }
  }

  private async handleResetPasswordJob(
    job: Job<{ email: string; otp: string; fullname: string }>,
  ) {
    const { email, fullname, otp } = job.data;

    try {
      await this.transporter.sendMail({
        from: `"No Reply" <${process.env.MAIL_FROM}>`,
        to: email,
        subject: 'Reset your password',
        html: passwordResetEmailTemplate({
          to: email,
          title: 'Reset your password',
          userName: fullname,
          otpCode: otp,
          expiresInMinutes: 10,
        }),
      });
      this.logger.log(`Reset password email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email to ${email}`,
        error,
      );
      throw error;
    }
  }
}
