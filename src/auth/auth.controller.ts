import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { CreateAuthDto } from './dto/create-auth.dto';
import { SignInAuthDto } from './dto/signin-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signUp(@Body() createAuthDto: CreateAuthDto) {
    return await this.authService.signUp(createAuthDto);
  }

  @Public()
  @Post('signin')
  async signIn(@Body() SignInAuthDto: SignInAuthDto) {
    return await this.authService.signIn(SignInAuthDto);
  }
  @Get('me')
  getMe(@CurrentUser() user: any) {
    return user;
  }

  @Post('verify-email')
  async verifyEmail(
    @CurrentUser() user: any,
    @Body() verifyEmailDto: VerifyEmailDto,
  ) {
    return this.authService.verifyEmail(user.id, verifyEmailDto.otp);
  }

  @Post('resend-otp')
  async resendOtp(@CurrentUser() user: any) {
    return this.authService.resendOtp(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@CurrentUser() user: any) {
    return this.authService.refresh(user.id, user.email, user.role);
  }

  @Post('signout')
  async signOut(@CurrentUser() user: any) {
    return this.authService.signOut(user.id);
  }
}
