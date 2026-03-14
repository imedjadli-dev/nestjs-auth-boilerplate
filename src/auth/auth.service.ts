import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signUp(createAuthDto: CreateAuthDto) {
    const existingUser = await this.prisma.users.findUnique({
      where: { email: createAuthDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Please check your email or password');
    }

    return this.prisma.users.create({ data: createAuthDto });
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

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
