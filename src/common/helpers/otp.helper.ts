import { randomInt } from 'node:crypto';

export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}
