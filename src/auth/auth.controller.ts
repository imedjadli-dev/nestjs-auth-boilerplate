import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordAuthDto } from './dto/change-passowrd-auth.dto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ForgetPasswordDto } from './dto/forget-password-auth.dto';
import { ResetPasswordDto } from './dto/reset-password-auth.dto';
import { SignInAuthDto } from './dto/signin-auth.dto';
 import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Regiser a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Public()
  @Post('signup')
  async signUp(@Body() createAuthDto: CreateAuthDto) {
    return await this.authService.signUp(createAuthDto);
  }

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Returns access and refresh tokens',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('signin')
  async signIn(@Body() SignInAuthDto: SignInAuthDto) {
    return await this.authService.signIn(SignInAuthDto);
  }

  @ApiBearerAuth() // ← shows lock icon, requires token in Swagger UI
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Returns current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('me')
  getMe(@CurrentUser() user: any) {
    return user;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @Post('verify-email')
  async verifyEmail(
    @CurrentUser() user: any,
    @Body() verifyEmailDto: VerifyEmailDto,
  ) {
    return this.authService.verifyEmail(user.id, verifyEmailDto.otp);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend OTP' })
  @Post('resend-otp')
  async resendOtp(@CurrentUser() user: any) {
    return this.authService.resendOtp(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

 

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh tokens' })
  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@CurrentUser() user: any) {
    return this.authService.refresh(user.id, user.email, user.role);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out' })
  @Post('signout')
  async signOut(@CurrentUser() user: any) {
    return this.authService.signOut(user.id);
  }

  @ApiOperation({ summary: 'Forgot password' })
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('forget-password')
  async forgetPassword(@Body() dto: ForgetPasswordDto) {
    return this.authService.forgetPassword(dto);
  }

  @ApiOperation({ summary: 'Reset password' })
  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordAuthDto: ChangePasswordAuthDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordAuthDto);
  }
}
