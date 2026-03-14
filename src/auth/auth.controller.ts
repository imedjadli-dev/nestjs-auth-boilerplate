import { Role } from '@generated/prisma/enums';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.dcorator';
import { Roles } from './decorators/roles.decorator';
import { CreateAuthDto } from './dto/create-auth.dto';
import { SignInAuthDto } from './dto/signin-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signUp(@Body() createAuthDto: CreateAuthDto) {
    const { user, token } = await this.authService.signUp(createAuthDto);
    return { message: 'User created successfully', user, token };
  }

  @Post('signin')
  async signIn(@Body() SignInAuthDto: SignInAuthDto) {
    const { user, access_token } = await this.authService.signIn(SignInAuthDto);
    return { message: 'User signed in successfully', user, access_token };
  }
  @Get('me')
  @Roles(Role.USER)
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: any) {
    return user;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
