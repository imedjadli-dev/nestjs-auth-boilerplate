import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class VerifiedUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    console.log('user', user);

    if (!user.isVerified) {
      throw new ForbiddenException(
        'User is not verified , please verify your email',
      );
    }

    return true;
  }
}
