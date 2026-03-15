-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetPasswordOtp" TEXT,
ADD COLUMN     "resetPasswordOtpExpiresAt" TIMESTAMP(3);
