import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { EMAIL_QUEUE, SEND_RESET_PASSWORD_JOB } from './email.constants';

export const SEND_OTP_JOB = 'send-otp';

@Processor(EMAIL_QUEUE)
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
        html: `
        <h2>Hello ${fullname},</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 8px">${otp}</h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you did not request this, ignore this email.</p>
      `,
      });
      this.logger.log(`OTP email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw error; // rethrow so BullMQ marks job as failed
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
        html: `
        <h2>Hello ${fullname},</h2>
        <p>You requested a password reset. Your code is:</p>
        <h1 style="letter-spacing: 8px">${otp}</h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you did not request this, ignore this email.</p>
      `,
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
