# NestJS Authentication Boilerplate

A production-ready authentication boilerplate built with NestJS, PostgreSQL, and Prisma. Includes everything you need to kickstart a secure backend API.

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT (Access + Refresh tokens)
- **Queue**: BullMQ + Redis
- **Email**: Nodemailer
- **Validation**: class-validator + Joi
- **Documentation**: Swagger
- **Security**: Helmet + @nestjs/throttler
- **Testing**: Jest

## Features

- ✅ Sign up with auto sign in
- ✅ Sign in with JWT access token + refresh token
- ✅ Refresh token rotation with bcrypt hashing
- ✅ Sign out with token invalidation
- ✅ Email verification with OTP (6 digits, 10 min expiry)
- ✅ Resend OTP
- ✅ Forgot password with OTP via email
- ✅ Reset password
- ✅ Change password (invalidates all other sessions)
- ✅ Role-based access control (USER, ADMIN)
- ✅ Email verification guard
- ✅ Background email queue (BullMQ + Redis)
- ✅ Rate limiting on sensitive endpoints
- ✅ Security headers (Helmet)
- ✅ Swagger API documentation
- ✅ Environment validation (Joi)
- ✅ Global exception filter
- ✅ Request logger middleware
- ✅ Unit tests

## Project Structure

```
src/
├── auth/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── roles.decorator.ts
│   ├── dto/
│   │   ├── create-auth.dto.ts
│   │   ├── signin-auth.dto.ts
│   │   ├── verify-email.dto.ts
│   │   ├── change-password.dto.ts
│   │   ├── forgot-password.dto.ts
│   │   └── reset-password.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── refresh-token.guard.ts
│   │   ├── roles.guard.ts
│   │   └── verified-user.guard.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── refresh-token.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   └── auth.service.spec.ts
├── common/
│   └── helpers/
│       └── otp.helper.ts
├── config/
│   └── env.validation.ts
├── email/
│   ├── email.constants.ts
│   ├── email.module.ts
│   ├── email.processor.ts
│   ├── email.service.ts
│   └── email.templates.ts
├── middleware/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── logger.middleware.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
```

## API Endpoints

### Auth

| Method | Endpoint                       | Auth          | Description             |
| ------ | ------------------------------ | ------------- | ----------------------- |
| POST   | `/api/v1/auth/signup`          | Public        | Register new user       |
| POST   | `/api/v1/auth/signin`          | Public        | Sign in                 |
| POST   | `/api/v1/auth/refresh`         | Refresh Token | Rotate tokens           |
| POST   | `/api/v1/auth/signout`         | Bearer Token  | Sign out                |
| GET    | `/api/v1/auth/me`              | Bearer Token  | Get current user        |
| POST   | `/api/v1/auth/verify-email`    | Bearer Token  | Verify email with OTP   |
| POST   | `/api/v1/auth/resend-otp`      | Bearer Token  | Resend OTP              |
| POST   | `/api/v1/auth/forgot-password` | Public        | Request password reset  |
| POST   | `/api/v1/auth/reset-password`  | Public        | Reset password with OTP |
| POST   | `/api/v1/auth/change-password` | Bearer Token  | Change password         |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis

### Installation

**1. Clone the repository:**

```bash
git clone https://github.com/imedjadli-dev/nestjs-auth-boilerplate
cd nestjs-auth-boilerplate
```

**2. Install dependencies:**

```bash
pnpm install
```

**3. Set up environment variables:**

```bash
cp .env.example .env
```

Fill in your `.env` file — see [Environment Variables](#environment-variables) section.

**4. Run database migrations:**

```bash
npx prisma migrate dev
npx prisma generate
```

**5. Start the development server:**

```bash
npm run start:dev
```

**6. Open Swagger docs:**

```
http://localhost:4000/api/docs
```

## Docker

The app is fully dockerized using a multi-stage build for a lean and secure production image.

### Prerequisites

- Docker installed on your machine

### Build the image

```bash
docker build -t nestjs-auth-boilerplate .
```

### Run the container

```bash
docker run --env-file .env --dns 8.8.8.8 -p 4000:4000 nestjs-auth-boilerplate
```

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=4000

# Database (Supabase or  PostgreSQL)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
DATABASE_DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://default:password@HOST:6379

# Mail (Mailtrap for development)
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_SECURE=false
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_pass
MAIL_FROM=noreply@yourdomain.com


```

## Authentication Flow

### Standard Authentication

```
POST /auth/signup
  → creates user
  → sends OTP email (background queue)
  → returns access_token + refresh_token

POST /auth/signin
  → verifies credentials
  → returns access_token + refresh_token

POST /auth/verify-email  (Authorization: Bearer <access_token>)
  Body: { "otp": "123456" }
  → verifies OTP
  → sets isVerified = true

POST /auth/refresh  (Authorization: Bearer <refresh_token>)
  → rotates both tokens
  → returns new access_token + refresh_token

POST /auth/signout  (Authorization: Bearer <access_token>)
  → invalidates refresh token
```

### Password Reset Flow

```
POST /auth/forgot-password
  Body: { "email": "john@example.com" }
  → sends OTP to email

POST /auth/reset-password
  Body: { "email": "...", "otp": "...", "newPassword": "...", "confirmPassword": "..." }
  → resets password
  → invalidates all sessions
```

## Guards & Decorators

### Guards

| Guard               | Description                                       |
| ------------------- | ------------------------------------------------- |
| `JwtAuthGuard`      | Applied globally — protects all routes by default |
| `RefreshTokenGuard` | Validates refresh tokens on `/auth/refresh`       |
| `RolesGuard`        | Applied globally — checks user role               |
| `VerifiedUserGuard` | Checks if user has verified their email           |

### Decorators

```ts
// skip authentication on a route
@Public()

// restrict route to specific roles
@Roles(Role.ADMIN)
@Roles(Role.ADMIN, Role.USER)

// get current authenticated user
@CurrentUser() user: any         // full user object
@CurrentUser('id') userId: number // specific field
```

### Usage Example

```ts
@Controller('products')
export class ProductsController {
  // public route — no token needed
  @Public()
  @Get()
  findAll() {}

  // any authenticated user
  @Get(':id')
  findOne() {}

  // authenticated + email verified
  @UseGuards(VerifiedUserGuard)
  @Post()
  create(@CurrentUser() user: any) {}

  // admin only
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@CurrentUser('id') userId: number) {}
}
```

## Running Tests

```bash
# unit tests
npm run test

# watch mode
npm run test:watch

# coverage
npm run test:cov
```

## Database Schema

```prisma
model users {
  id                        Int       @id @default(autoincrement())
  email                     String    @unique
  password                  String?
  fullname                  String?
  role                      Role      @default(USER)
  refreshToken              String?
  isVerified                Boolean   @default(false)
  otp                       String?
  otpExpiresAt              DateTime?
  resetPasswordOtp          String?
  resetPasswordOtpExpiresAt DateTime?
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

## Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- Refresh tokens hashed with **bcrypt** before storage
- Short-lived access tokens (15 min default)
- Refresh token rotation on every refresh
- Refresh token invalidated on signout
- Rate limiting on sensitive endpoints
- HTTP security headers via **Helmet**
- Environment variables validated on startup

## Roadmap

- [ ] Jenkins
- [ ] DevOps


## License

MIT
