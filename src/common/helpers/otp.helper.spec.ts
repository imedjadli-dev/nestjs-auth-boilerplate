import { generateOtp } from './otp.helper';

describe('generateOtp', () => {
  it('should generate a 6-digit OTP', () => {
    const otp = generateOtp();

    expect(otp).toMatch(/^\d{6}$/);
  });

  it('should generate an OTP between 100000 and 999999', () => {
    const otp = Number(generateOtp());

    expect(otp).toBeGreaterThanOrEqual(100000);
    expect(otp).toBeLessThanOrEqual(999999);
  });

  it('should generate different OTPs', () => {
    const otps = new Set(Array.from({ length: 100 }, () => generateOtp()));

    expect(otps.size).toBeGreaterThan(1);
  });
});
