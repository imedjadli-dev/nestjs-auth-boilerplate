import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  signUp: jest.fn(),
  signIn: jest.fn(),
  verifyEmail: jest.fn(),
  resendOtp: jest.fn(),
  changePassword: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  refresh: jest.fn(),
  signOut: jest.fn(),
};

describe('AuthController', () => {
  let authController: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('signUp', () => {
    it('should call authService.signUp with correct dto', async () => {
      const dto = {
        email: 'john@example.com',
        password: 'Password123',
        fullname: 'John Doe',
      };
      mockAuthService.signUp.mockResolvedValue({
        user: { id: 1, email: dto.email },
        access_token: 'token',
        refresh_token: 'refresh',
      });

      const result = await authController.signUp(dto as any);

      expect(mockAuthService.signUp).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('access_token');
    });
  });

  describe('signIn', () => {
    it('should call authService.signIn with correct dto', async () => {
      const dto = { email: 'john@example.com', password: 'Password123' };
      mockAuthService.signIn.mockResolvedValue({
        user: { id: 1 },
        access_token: 'token',
        refresh_token: 'refresh',
      });

      const result = await authController.signIn(dto as any);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('access_token');
    });
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail with user id and otp', async () => {
      const user = { id: 1 };
      const dto = { otp: '123456' };
      mockAuthService.verifyEmail.mockResolvedValue({
        message: 'Email verified successfully',
      });

      const result = await authController.verifyEmail(user, dto as any);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(1, '123456');
      expect(result.message).toBe('Email verified successfully');
    });
  });

  describe('signOut', () => {
    it('should call authService.signOut with user id', async () => {
      const user = { id: 1 };
      mockAuthService.signOut.mockResolvedValue({
        message: 'Signed out successfully',
      });

      const result = await authController.signOut(user);

      expect(mockAuthService.signOut).toHaveBeenCalledWith(1);
      expect(result.message).toBe('Signed out successfully');
    });
  });
});
