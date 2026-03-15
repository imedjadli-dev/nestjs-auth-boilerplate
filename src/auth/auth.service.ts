import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { StringValue } from 'ms';
import { generateOtp } from 'src/common/helpers/otp.helper';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { SignInAuthDto } from './dto/signin-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private async generateTokkens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET as string,
        expiresIn: process.env.JWT_EXPIRES_IN as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET as string,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as StringValue,
      }),
    ]);

    return { access_token, refresh_token };
  }

  private async saveRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.users.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async signUp(createAuthDto: CreateAuthDto) {
    const existingUser = await this.prisma.users.findUnique({
      where: { email: createAuthDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Please check your email or password');
    }

    const HashedPassword = await bcrypt.hash(createAuthDto.password, 10);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
    const user = await this.prisma.users.create({
      data: {
        email: createAuthDto.email,
        fullname: createAuthDto.fullname,
        password: HashedPassword,
        otp,
        otpExpiresAt,
      },

      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
      },
    });

    await this.emailService.sendOtp(user.email, otp, user.fullname ?? 'User');
    const tokens = await this.generateTokkens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refresh_token);

    return { user, ...tokens };
  }

  async signIn(signInAuthDto: SignInAuthDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: signInAuthDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Please check your email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      signInAuthDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Please check your email or password');
    }

    const tokens = await this.generateTokkens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refresh_token);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refresh(userId: number, email: string, role: string) {
    const tokens = await this.generateTokkens(userId, email, role);
    await this.saveRefreshToken(userId, tokens.refresh_token);
    return tokens;
  }

  async signOut(userId: number) {
    await this.prisma.users.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Signed out successfully' };
  }

  async verifyEmail(userId: number, otp: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) throw new UnauthorizedException('User not found');

    if (user.isVerified) {
      return { message: 'Email already verified' };
    }

    if (!user.otp || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP found, request a new one');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP has expired, request a new one');
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.prisma.users.update({
      where: { id: userId },
      data: {
        isVerified: true,
        otp: null,
        otpExpiresAt: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendOtp(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) throw new UnauthorizedException();

    if (user.isVerified) {
      return { message: 'Email already verified' };
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
    await this.prisma.users.update({
      where: { id: userId },
      data: {
        otp,
        otpExpiresAt,
      },
    });

    await this.emailService.sendOtp(user.email, otp, user.fullname ?? 'User');

    return { message: 'OTP resent successfully' };
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }
}
