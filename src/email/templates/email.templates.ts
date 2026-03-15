import { baseEmailTemplate } from './email.base.template';
import {
  BookingCancellationEmailDto,
  BookingConfirmationEmailDto,
  OtpEmailDto,
  PasswordResetEmailDto,
} from './email.types';

// ─────────────────────────────────────────────
// 1. OTP / Verification
// ─────────────────────────────────────────────
export function otpEmailTemplate(dto: OtpEmailDto): string {
  const expires = dto.expiresInMinutes ?? 10;

  const content = /* html */ `
    <h2 class="email-title">${dto.title}</h2>
    <p class="email-intro">Hi ${dto.userName}, use the code below to complete your verification.</p>

    <div class="otp-block">
      <div class="otp-accent"></div>
      <p class="otp-label">One-time code</p>
      <div class="otp-code">${dto.otpCode}</div>
    </div>

    <div class="notice">
      <span style="color:#f5c842;font-size:16px;flex-shrink:0;">⚠</span>
      <p class="notice-text">
        This code expires in <strong>${expires} minutes</strong>.
        Never share it with anyone.
      </p>
    </div>

    <hr class="divider" />
    <p class="security-note">If you didn't request this, you can safely ignore this email.</p>
  `;

  return baseEmailTemplate({
    title: 'Verify your email',
    preheader: `Your verification code is ${dto.otpCode} — expires in ${expires} minutes.`,
    content,
  });
}

// ─────────────────────────────────────────────
// 2. Booking Confirmation
// ─────────────────────────────────────────────
export function bookingConfirmationEmailTemplate(
  dto: BookingConfirmationEmailDto,
): string {
  const content = /* html */ `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:8px;">
      <h2 class="email-title" style="margin-bottom:0;">Booking Confirmed</h2>
      <span class="badge-success">Confirmed</span>
    </div>
    <p class="email-intro">Hi ${dto.userName}, your booking has been successfully confirmed. Here are the details:</p>

    <div class="info-block">
      <div class="info-row">
        <span class="info-label">Booking ID</span>
        <span class="info-value" style="font-family:'Courier New',monospace;color:#4f9cf9;">#${dto.bookingId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Service</span>
        <span class="info-value">${dto.serviceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date</span>
        <span class="info-value">${dto.bookingDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time</span>
        <span class="info-value">${dto.bookingTime}</span>
      </div>
      ${
        dto.location
          ? `<div class="info-row">
               <span class="info-label">Location</span>
               <span class="info-value">${dto.location}</span>
             </div>`
          : ''
      }
      ${
        dto.totalAmount
          ? `<div class="info-row">
               <span class="info-label">Total</span>
               <span class="info-value" style="color:#34c759;font-weight:600;">${dto.totalAmount}</span>
             </div>`
          : ''
      }
    </div>

    <hr class="divider" />
    <p class="security-note">
      Need to make changes? Contact our support team as soon as possible.
    </p>
  `;

  return baseEmailTemplate({
    title: 'Booking Confirmed',
    preheader: `Your booking for ${dto.serviceName} on ${dto.bookingDate} is confirmed.`,
    content,
  });
}

// ─────────────────────────────────────────────
// 3. Booking Cancellation
// ─────────────────────────────────────────────
export function bookingCancellationEmailTemplate(
  dto: BookingCancellationEmailDto,
): string {
  const content = /* html */ `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:8px;">
      <h2 class="email-title" style="margin-bottom:0;">Booking Cancelled</h2>
      <span class="badge-danger">Cancelled</span>
    </div>
    <p class="email-intro">Hi ${dto.userName}, your booking has been cancelled. See the details below.</p>

    <div class="info-block">
      <div class="info-row">
        <span class="info-label">Booking ID</span>
        <span class="info-value" style="font-family:'Courier New',monospace;color:#4f9cf9;">#${dto.bookingId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Service</span>
        <span class="info-value">${dto.serviceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date</span>
        <span class="info-value">${dto.bookingDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time</span>
        <span class="info-value">${dto.bookingTime}</span>
      </div>
      ${
        dto.reason
          ? `<div class="info-row">
               <span class="info-label">Reason</span>
               <span class="info-value">${dto.reason}</span>
             </div>`
          : ''
      }
    </div>

    <div class="notice">
      <span style="color:#f5c842;font-size:16px;flex-shrink:0;">⚠</span>
      <p class="notice-text">
        If you believe this cancellation was made in error,
        please <strong>contact support immediately</strong>.
      </p>
    </div>

    <hr class="divider" />
    <p class="security-note">
      If you initiated this cancellation, no further action is required.
    </p>
  `;

  return baseEmailTemplate({
    title: 'Booking Cancelled',
    preheader: `Your booking for ${dto.serviceName} on ${dto.bookingDate} has been cancelled.`,
    content,
  });
}

// ─────────────────────────────────────────────
// 4. Password Reset
// ─────────────────────────────────────────────
export function passwordResetEmailTemplate(dto: PasswordResetEmailDto): string {
  const expires = dto.expiresInMinutes ?? 10;

  const content = /* html */ `
    <h2 class="email-title">${dto.title}</h2>
    <p class="email-intro">
      Hi ${dto.userName}, we received a request to reset your password.
      Use the code below to proceed.
    </p>

    <div class="otp-block">
      <div class="otp-accent"></div>
      <p class="otp-label">Reset code</p>
      <div class="otp-code">${dto.otpCode}</div>
    </div>

    <div class="notice">
      <span style="color:#f5c842;font-size:16px;flex-shrink:0;">⚠</span>
      <p class="notice-text">
        This code expires in <strong>${expires} minutes</strong>.
        If you didn't request a password reset, ignore this email — your account is safe.
      </p>
    </div>

    <hr class="divider" />
    <p class="security-note">Never share this code with anyone, including our support team.</p>
  `;

  return baseEmailTemplate({
    title: 'Reset your password',
    preheader: `Your password reset code is ${dto.otpCode} — expires in ${expires} minutes.`,
    content,
  });
}
