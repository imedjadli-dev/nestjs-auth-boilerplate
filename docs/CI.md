# CI Pipeline

The `Jenkinsfile` at the repository root defines the Jenkins pipeline that runs on every build.

## Stages

| Stage                  | What it does                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ |
| Project Setup          | Enables Corepack so the pinned pnpm version is used                                  |
| Install Dependencies   | `pnpm install --frozen-lockfile`                                                     |
| Prisma Generate        | Generates the Prisma client                                                          |
| Code Quality Checks    | `pnpm run lint:ci` and `pnpm run test:cov` in parallel                               |
| SonarQube Analysis     | Runs `sonar-scanner` through `withSonarQubeEnv`                                      |
| Quality Gate           | Fails the build if the SonarQube quality gate fails                                  |
| Docker build           | `docker compose build api`                                                           |
| Compose up & health    | Starts the full stack with `--wait`, then checks `GET /health`                       |
| Post (always)          | Prints logs, runs `docker compose down -v --remove-orphans`, removes `.env`, cleans the workspace |

## Why everything is deleted after the run

The stack is torn down after every run on purpose. The pipeline is a verification (build, test, analyze, start the stack, check health), not a deployment. Cleaning up means:

- every build starts from a clean database, so results are reproducible
- no leftover containers keep ports `4000`, `5433` or `6379` busy
- volumes do not pile up (the compose project name includes the build number)
- the `.env` file with secrets does not stay in the workspace

## Jenkins setup

The pipeline expects the following configuration in Jenkins. Names are case-sensitive and must match the `Jenkinsfile`.

| Item                       | Where                          | Value                                                                  |
| -------------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| NodeJS tool                | Manage Jenkins > Tools         | `node24` (Node 24.x)                                                   |
| JDK tool                   | Manage Jenkins > Tools         | `jdk21` (the SonarQube scanner requires Java 21 or newer)              |
| SonarQube server           | Manage Jenkins > System        | Name `SonarQube`, server URL, token as a Secret text credential; enable environment variable injection |
| Secret file credential     | Manage Jenkins > Credentials   | ID `nestjs-env`: a `.env` file with all app variables plus the compose variables (CI-only values) |
| SonarQube webhook          | SonarQube > Administration > Webhooks | `http://<jenkins-url>/sonarqube-webhook/` (needed for the quality gate) |
| Plugins                    | Manage Jenkins > Plugins       | Pipeline, Credentials Binding, Timestamper, Workspace Cleanup, NodeJS, SonarQube Scanner |

The Jenkins agent also needs Docker with the Compose plugin and `curl`.

Secrets are never stored in the repository: the SonarQube token and the application `.env` are injected by Jenkins credentials.

## Planned

See the [Roadmap](../README.md#roadmap): publishing the image to Docker Hub and Nexus, a Trivy scan before publishing, and automated deployment.