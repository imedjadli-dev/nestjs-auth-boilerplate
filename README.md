# NestJS Authentication Boilerplate

A production-ready authentication boilerplate built with NestJS, PostgreSQL, and Prisma. Includes everything you need to kickstart a secure backend API, plus a Dockerized stack, monitoring, a Jenkins CI pipeline and an Ansible deployment.

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
- **Containers**: Docker + Docker Compose
- **Monitoring**: Prometheus + Grafana (prom-client)
- **CI**: Jenkins + SonarQube (quality gate) + Trivy (image scan)
- **Registries**: Docker Hub + Nexus
- **Deployment**: Ansible

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
- ✅ Health check and Prometheus metrics endpoints
- ✅ Unit tests

## Project Structure

```
.
├── ansible/                # local deployment with Ansible
├── docs/                   # CI pipeline and Jenkins setup (CI.md)
├── monitoring/             # Prometheus config, Grafana provisioning and dashboard
├── prisma/                 # schema and migrations
├── src/
│   ├── auth/               # controller, service, DTOs, guards, strategies, decorators
│   ├── common/             # shared helpers (OTP)
│   ├── config/             # environment validation (Joi)
│   ├── email/              # BullMQ queue, processor, mail service and templates
│   ├── health/             # GET /health
│   ├── metrics/            # GET /metrics (Prometheus)
│   ├── middleware/         # request logger, global exception filter
│   ├── prisma/             # Prisma module and service
│   ├── redis/              # Redis module and service
│   ├── app.module.ts
│   └── main.ts
├── test/
├── Dockerfile
├── docker-compose.yml
├── Jenkinsfile
└── sonar-project.properties
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

### Operations

Both endpoints are public, sit outside the `/api/v1` prefix and are not rate limited.

| Method | Endpoint   | Description                                          |
| ------ | ---------- | ---------------------------------------------------- |
| GET    | `/health`  | Liveness check (used by Docker and CI)               |
| GET    | `/metrics` | Prometheus metrics (default Node.js process metrics) |

## Getting Started

### Prerequisites

- Node.js 24 (matches CI and the Docker image)
- pnpm (via Corepack: `corepack enable`; the version is pinned in `package.json`)
- PostgreSQL and Redis (or use the Docker Compose stack below)
- Docker with the Compose plugin (optional, for the containerized stack)

### Installation

**1. Clone the repository:**

```bash
git clone https://github.com/imedjadli-dev/nestjs-auth-boilerplate
cd nestjs-auth-boilerplate
```

**2. Install dependencies:**

```bash
corepack enable
pnpm install
```

**3. Set up environment variables:**

```bash
cp .env.example .env
```

Fill in your `.env` file. Every variable is listed in [`.env.example`](.env.example).

**4. Run database migrations:**

```bash
pnpm exec prisma migrate dev
pnpm exec prisma generate
```

**5. Start the development server:**

```bash
pnpm start:dev
```

**6. Open Swagger docs:**

```
http://localhost:4000/api/docs
```

## Scripts

| Script            | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `pnpm start:dev`  | Start in watch mode                                            |
| `pnpm build`      | Compile to `dist/`                                             |
| `pnpm start:prod` | Run the compiled app (`node dist/src/main`)                    |
| `pnpm lint`       | ESLint with auto-fix (local use)                               |
| `pnpm lint:ci`    | ESLint without auto-fix, exits non-zero on errors (used by CI) |
| `pnpm test`       | Unit tests                                                     |
| `pnpm test:cov`   | Unit tests with coverage (feeds SonarQube)                     |

## Docker

The repository ships a single-stage `Dockerfile` and a `docker-compose.yml` that runs the whole stack.

The image:

- is based on `node:24-alpine`, with pnpm pinned through Corepack (`packageManager` field)
- runs as the non-root `node` user
- includes a `HEALTHCHECK` on `/health`
- keeps devDependencies so the same image can run `prisma migrate deploy`

### Services

| Service      | Description                                                           | Host port        | Profile      |
| ------------ | --------------------------------------------------------------------- | ---------------- | ------------ |
| `postgres`   | PostgreSQL 17 with a persistent volume and healthcheck                | `127.0.0.1:5433` | default      |
| `redis`      | Redis 7, password protected, `noeviction` policy (required by BullMQ) | `127.0.0.1:6379` | default      |
| `migrate`    | One-shot job that runs `prisma migrate deploy`, then exits            | none             | default      |
| `api`        | The NestJS app, starts after Postgres, Redis and migrations are ready | `4000`           | default      |
| `prometheus` | Scrapes the API `/metrics` endpoint every 15 seconds                  | `127.0.0.1:9090` | `monitoring` |
| `grafana`    | Dashboards, provisioned from files                                    | `127.0.0.1:3000` | `monitoring` |

Postgres is published on host port `5433` to avoid clashing with a local PostgreSQL on `5432`. Containers reach each other through the service names (`postgres`, `redis`).

### Run the stack

```bash
cp .env.example .env        # fill in values, including the compose variables
docker compose up -d --build --wait
docker compose ps           # api, postgres and redis should be healthy; migrate exited (0)
curl -i http://localhost:4000/health
```

### Stop and clean up

```bash
docker compose down         # keep the data
docker compose down -v      # also delete the database and Redis volumes
```

### Notes

- `docker-compose.yml` overrides `DATABASE_URL` and `REDIS_URL` for the containers, so your `.env` can keep `localhost` values for running the app outside Docker.
- Remove the `ports` entries for Postgres and Redis if you deploy the stack anywhere other than a development machine.

## Monitoring

Prometheus and Grafana are optional and sit behind the Compose profile `monitoring`, so a plain `docker compose up` and the CI pipeline do not start them.

```bash
docker compose --profile monitoring up -d
```

| Tool       | URL                     | Notes                                                       |
| ---------- | ----------------------- | ----------------------------------------------------------- |
| Prometheus | `http://localhost:9090` | Status > Targets: `nestjs-api` should be UP                 |
| Grafana    | `http://localhost:3000` | Log in with `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD` |

- The API exposes default Node.js process metrics (CPU, memory, event loop lag) on `GET /metrics`.
- The Prometheus datasource and the **NestJS API Overview** dashboard are provisioned from files in [`monitoring/`](monitoring), so nothing is configured by hand and everything comes back after `docker compose down -v`.
- Provisioned dashboards are read-only in the UI. To change one, edit it in Grafana, export it (Share > Export > Save to file) and replace `monitoring/grafana/dashboards/nestjs.json`.
- `/metrics` is public. Block it at your reverse proxy in production.

## Deployment with Ansible

The [`ansible/`](ansible) folder deploys the Compose stack on the local machine. It renders a `.env` file from a template, starts the stack with the `community.docker` collection and checks `GET /health`.

**Prerequisites**

```bash
brew install ansible
ansible-galaxy collection install community.docker
```

**Configure the variables**

Copy each `*.example` file in `ansible/group_vars/all/` to the same name without `.example` and fill in the values. The real files are git-ignored, so secrets are never committed.

**Deploy**

```bash
docker compose down         # stop a dev stack first: both use the same host ports
cd ansible
ansible-playbook playbooks/03-deploy.yml
```

Running the playbook again changes nothing when the configuration is the same. The deployment runs as its own Compose project (`nestjs-auth-deploy`), so it has its own volumes and starts from a clean database.

## Authentication Flow

All paths below are relative to the `/api/v1` prefix.

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

| Guard               | Description                                      |
| ------------------- | ------------------------------------------------ |
| `JwtAuthGuard`      | Applied globally: protects all routes by default |
| `RefreshTokenGuard` | Validates refresh tokens on `/auth/refresh`      |
| `RolesGuard`        | Applied globally: checks user role               |
| `VerifiedUserGuard` | Checks if user has verified their email          |

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

## CI/CD Pipeline

A Jenkins pipeline (`Jenkinsfile`) runs on every build:

1. install dependencies, lint and unit tests in parallel
2. SonarQube analysis with a quality gate
3. Docker image build
4. Trivy image scan (HIGH and CRITICAL, report archived with the build; it does not fail the build yet)
5. the full Docker Compose stack is started and verified through `GET /health` and `GET /metrics`
6. on `main` only, the image is pushed to Docker Hub and Nexus, tagged with the build number and `latest`

The stack is torn down after each run, so the verification stages never leave anything running.

Stages and the required Jenkins configuration are documented in [docs/CI.md](docs/CI.md).

## Database Schema

See [`prisma/schema.prisma`](prisma/schema.prisma) for the models and migrations.

## Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- Refresh tokens hashed with **bcrypt** before storage
- Short-lived access tokens (15 min default)
- Refresh token rotation on every refresh
- Refresh token invalidated on signout
- Rate limiting on sensitive endpoints
- HTTP security headers via **Helmet**
- Environment variables validated on startup
- Docker container runs as a non-root user
- `.env` is never committed and is excluded from the Docker build context
- Container images are scanned with Trivy in CI
- CI secrets (SonarQube token, registry logins, application `.env`) are injected through Jenkins credentials
- Ansible secret variables live in git-ignored files
- `/metrics` is public: restrict it at the reverse proxy in production

## Roadmap

- [x] Jenkins CI pipeline (lint, tests, SonarQube quality gate)
- [x] Docker Compose stack (API, PostgreSQL, Redis, migrations)
- [x] Push the image to Docker Hub and Nexus
- [x] Image vulnerability scan (Trivy), report only
- [x] Prometheus and Grafana monitoring
- [x] Local deployment with Ansible
- [ ] Fail the build on fixable CRITICAL vulnerabilities
- [ ] Ansible roles and a Jenkins deploy stage
- [ ] HTTP request metrics (rate, latency, errors)

## License

MIT
