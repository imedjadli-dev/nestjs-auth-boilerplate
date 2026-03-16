import { PrismaService } from '@lib/prisma.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/email/email.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn(),
}));
const mockPrismaService = {
  users: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockEmailService = {
  sendOtp: jest.fn(),
  sendResetPassword: jest.fn(),
};

const mockUser = {
  id: 1,
  fullname: 'Imed Jadli',
  password: '$2b$10$hashedpassword',
  email: 'imedjadli@example.com',
  role: 'USER',
  isVerified: false,
  otp: '123456',
  otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
  refreshToken: '$2b$10$hashedrefreshtoken',
  resetPasswordOtp: null,
  resetPasswordOtpExpiresAt: null,
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SignUp

  describe('signUp', () => {
    const signUpDto = {
      email: 'imedjadli@example.com',
      fullname: 'Imed Jadli',
      password: 'Password123',
    };

    it('should throw UnauthorizedException if email already exists', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      await expect(service.signUp(signUpDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should hash the password before saving', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue({
        ...mockUser,
        isVerified: false,
      });

      mockJwtService.signAsync.mockResolvedValue('token');
      mockPrismaService.users.update.mockResolvedValue({});
      mockEmailService.sendOtp.mockResolvedValue(undefined);

      await service.signUp(signUpDto);

      const createCall = mockPrismaService.users.create.mock.calls[0][0];
      expect(createCall.data.password).not.toBe('Password123');
      expect(createCall.data.password).toMatch(/^\$2b\$/);
    });

    it('should return user with access_token and refresh_token', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue({
        id: 1,
        email: 'imedjadli@example.com',
        fullname: 'Imed Jadli',
        role: 'USER',
      });
      mockJwtService.signAsync
        .mockResolvedValue('access_token')
        .mockResolvedValue('refresh_token');
      mockPrismaService.users.update.mockResolvedValue({});
      mockEmailService.sendOtp.mockResolvedValue(undefined);

      const result = await service.signUp(signUpDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('imedjadli@example.com');
    });

    it('should send OTP email after signup', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue({
        id: 1,
        email: 'imedjadli@example.com',
        fullname: 'Imed Jadli',
        role: 'USER',
      });
      mockJwtService.signAsync.mockResolvedValue('token');
      mockPrismaService.users.update.mockResolvedValue({});

      await service.signUp(signUpDto);

      expect(mockEmailService.sendOtp).toHaveBeenCalledTimes(1);
    });
  });

  describe('signIn', () => {
    const signInDto = {
      email: 'imedjadli@example.com',
      password: 'Password123',
    };

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.signIn(signInDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return user with tokens on valid credentials', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');
      mockPrismaService.users.update.mockResolvedValue({});

      const result = await service.signIn(signInDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user.email).toBe('imedjadli@example.com');
    });
  });

  describe('verifyEmail', () => {
    it('should return already verified message if user is verified', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        ...mockUser,
        isVerified: true,
      });

      const result = await service.verifyEmail(1, '123456');
      expect(result.message).toBe('Email already verified');
    });

    it('should throw BadRequestException if OTP is expired', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        ...mockUser,
        otpExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.verifyEmail(1, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if OTP is wrong', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

      await expect(service.verifyEmail(1, 'wrong')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should verify email successfully with correct OTP', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.users.update.mockResolvedValue({});

      const result = await service.verifyEmail(1, '123456');

      expect(result.message).toBe('Email verified successfully');
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isVerified: true, otp: null, otpExpiresAt: null },
      });
    });
  });

  describe('verifyEmail', () => {
    it('should return already verified message if user is verified', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        ...mockUser,
        isVerified: true,
      });

      const result = await service.verifyEmail(1, '123456');
      expect(result.message).toBe('Email already verified');
    });

    it('should throw BadRequestException if OTP is expired', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        ...mockUser,
        otpExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.verifyEmail(1, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if OTP is wrong', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

      await expect(service.verifyEmail(1, 'wrong')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should verify email successfully with correct OTP', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.users.update.mockResolvedValue({});

      const result = await service.verifyEmail(1, '123456');

      expect(result.message).toBe('Email verified successfully');
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isVerified: true, otp: null, otpExpiresAt: null },
      });
    });
  });

  describe('verifyEmail', () => {
    it('should return already verified message if user is verified', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        ...mockUser,
        isVerified: true,
      });

      const result = await service.verifyEmail(1, '123456');
      expect(result.message).toBe('Email already verified');
    });

    it('should throw BadRequestException if OTP is expired', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        ...mockUser,
        otpExpiresAt: new Date(Date.now() - 1000), // past
      });

      await expect(service.verifyEmail(1, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if OTP is wrong', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

      await expect(service.verifyEmail(1, 'wrong')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should verify email successfully with correct OTP', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.users.update.mockResolvedValue({});

      const result = await service.verifyEmail(1, '123456');

      expect(result.message).toBe('Email verified successfully');
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isVerified: true, otp: null, otpExpiresAt: null },
      });
    });
  });

  describe('verifyEmail', () => {
    it('should return already verified message if user is verified', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        ...mockUser,
        isVerified: true,
      });

      const result = await service.verifyEmail(1, '123456');
      expect(result.message).toBe('Email already verified');
    });

    it('should throw BadRequestException if OTP is expired', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue({
        ...mockUser,
        otpExpiresAt: new Date(Date.now() - 1000), // past
      });

      await expect(service.verifyEmail(1, '123456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if OTP is wrong', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);

      await expect(service.verifyEmail(1, 'wrong')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should verify email successfully with correct OTP', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.users.update.mockResolvedValue({});

      const result = await service.verifyEmail(1, '123456');

      expect(result.message).toBe('Email verified successfully');
      expect(mockPrismaService.users.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isVerified: true, otp: null, otpExpiresAt: null },
      });
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
