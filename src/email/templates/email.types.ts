export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface OtpEmailDto {
  to: string;
  title: string;
  userName: string;
  otpCode: string;
  expiresInMinutes?: number; // default: 10
}

export interface BookingConfirmationEmailDto {
  to: string;
  userName: string;
  bookingId: string;
  serviceName: string;
  bookingDate: string; // e.g. "Monday, March 15, 2026"
  bookingTime: string; // e.g. "10:00 AM"
  location?: string;
  totalAmount?: string; // e.g. "120.00 TND"
}

export interface BookingCancellationEmailDto {
  to: string;
  userName: string;
  bookingId: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  reason?: string;
}

export interface PasswordResetEmailDto {
  to: string;
  title: string;
  userName: string;
  otpCode: string;
  expiresInMinutes?: number; // default: 10
}
