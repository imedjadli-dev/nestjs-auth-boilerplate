import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { StringValue } from 'ms';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { SignInAuthDto } from './dto/signin-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
    await this.prisma.users.update({
      where: { id: userId },
      data: { refreshToken },
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
    const user = await this.prisma.users.create({
      data: { ...createAuthDto, password: HashedPassword },

      select: {
        id: true,
        email: true,
        fullname: true,
        role: true,
      },
    });

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
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
    const tokens = this.generateTokkens(userId, email, role);
    await this.saveRefreshToken(userId, (await tokens).refresh_token);
    return tokens;
  }

  async signOut(userId: number) {
    await this.prisma.users.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Signed out successfully' };
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
