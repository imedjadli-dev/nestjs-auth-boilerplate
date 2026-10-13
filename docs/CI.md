# CI/CD Pipeline

The `Jenkinsfile` at the repository root defines the Jenkins pipeline that runs on every build. On `main` it also publishes the image and deploys it.

## Stages

| Stage                               | Runs on | What it does                                                                                       |
| ----------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| Project Setup                       | all     | Enables Corepack so the pinned pnpm version is used                                                |
| Install Dependencies                | all     | `pnpm install --frozen-lockfile`                                                                   |
| Prisma Generate                     | all     | Generates the Prisma client                                                                        |
| Code Quality Checks                 | all     | `pnpm run lint:ci` and `pnpm run test:cov --runInBand` in parallel                                 |
| SonarQube Analysis                  | all     | Runs `sonar-scanner` through `withSonarQubeEnv`                                                    |
| Quality Gate                        | all     | Fails the build if the SonarQube quality gate fails                                                |
| Docker build                        | all     | `docker compose build api`, tagged `nestjs-auth:<build number>`                                    |
| Trivy image scan                    | all     | Scans the image for HIGH and CRITICAL CVEs (unfixed ones ignored) and archives `trivy-report.txt`  |
| Compose up & health check           | all     | Starts the full stack with `--wait`, then checks `GET /health` and `GET /metrics`                  |
| Push image to Docker Hub and Nexus  | `main`  | Tags the image with the build number and `latest`, pushes to both registries (retried up to 3 times) |
| Deploy with Ansible                 | `main`  | Stops the CI stack, then runs the Ansible `deploy` tag with the freshly built image tag            |
| Post (always)                       | all     | Prints logs, tears down the CI stack, logs out of both registries, removes `.env`, cleans the workspace |

The Trivy stage only reports for now (`--exit-code 0`): it never fails the build.

## Verification stack vs deployed stack

Two separate Docker Compose projects are involved, and they behave differently on purpose.

| Stack        | Compose project              | Lifetime                                                       |
| ------------ | ---------------------------- | -------------------------------------------------------------- |
| Verification | `nestjs-auth-<build number>` | Started to prove the image works, **torn down after every run** |
| Deployed     | `nestjs-auth-deploy`         | Started by Ansible on `main`, **keeps running** between builds |

Tearing down the verification stack means every build starts from a clean database, leaves no containers or volumes behind, and removes the `.env` file with secrets from the workspace.

Both stacks publish the same host ports (`4000`, `5433`, `6379`). The deploy stage therefore stops the verification stack before Ansible starts the deployed one.

## Deploy stage

On `main`, after a successful push, the pipeline runs:

```bash
docker compose down -v --remove-orphans      # free the ports used by the CI stack
cd ansible
ansible-galaxy collection install -r requirements.yml
ansible-playbook site.yml --tags deploy -e @"$ANSIBLE_VARS" -e image_tag="$IMAGE_TAG"
```

- `--tags deploy` runs only the `nestjs_app` role. The `prerequisites` role (Homebrew and Docker Desktop) is not part of CI.
- `-e image_tag=<build number>` deploys the exact image that was just built, scanned and pushed.
- The variables file (`ansible-vars` credential) replaces the git-ignored `group_vars/all/*.yml` files, which do not exist in a Jenkins checkout.
- The role fails the build if `GET /health` does not answer after the stack starts.
- A handler recreates the containers only when the rendered `.env` changed.

To roll back, run the same Ansible command with an older build number as `image_tag`.

## Jenkins setup

The pipeline expects the following configuration in Jenkins. Names are case-sensitive and must match the `Jenkinsfile`.

### Tools and servers

| Item             | Where                   | Value                                                                                                  |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| NodeJS tool      | Manage Jenkins > Tools  | `node24` (Node 24.x)                                                                                   |
| JDK tool         | Manage Jenkins > Tools  | `jdk21` (the SonarQube scanner requires Java 21 or newer)                                              |
| SonarQube server | Manage Jenkins > System | Name `SonarQube`, server URL, token as a Secret text credential; enable environment variable injection |

### Credentials

| ID              | Kind                | Content                                                                                       |
| --------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `nestjs-env`    | Secret file         | A `.env` file with the application and Docker Compose variables (CI-only values)              |
| `dockerhub-creds` | Username with password | Docker Hub username and an access token (not the account password)                        |
| `nexus-creds`   | Username with password | A dedicated Nexus CI user with write access to the Docker repository (not `admin`)         |
| `ansible-vars`  | Secret file         | One YAML file with all Ansible variables, `vars.yml` and `vault.yml` merged                   |

### Plugins

Pipeline, Credentials Binding, Timestamper, Workspace Cleanup, NodeJS, SonarQube Scanner.

### Agent requirements

- Docker with the Compose plugin, and `curl`
- Trivy
- Ansible (the pipeline installs the collections from `ansible/requirements.yml`)
- On macOS, the Jenkins global `PATH` must include the directory with these tools, for example `/opt/homebrew/bin`
- `ansible/ansible.cfg` must not reference a vault password file, because that file does not exist in a Jenkins checkout

### SonarQube webhook

In SonarQube, add a webhook to `http://<jenkins-url>/sonarqube-webhook/` (Administration > Configuration > Webhooks). The quality gate stage needs it to receive the result.

### Nexus Docker registry

- Create a **Docker (hosted)** repository with its own **HTTP connector port**, for example `8082`. The web UI port (`8081`) cannot serve Docker.
- Enable the **Docker Bearer Token Realm** (Security > Realms), or `docker login` fails.
- Set the deployment policy to allow redeploy, because `latest` is overwritten on every build.
- The registry address is set in the `Jenkinsfile` as `NEXUS_REGISTRY` (`127.0.0.1:8082`). Docker accepts plain HTTP for `127.0.0.1`. Any other host needs HTTPS or an insecure-registries entry.

Secrets are never stored in the repository: the SonarQube token, registry logins, the application `.env` and the Ansible variables are all injected by Jenkins credentials.

## Current limitations

- The deploy stage deploys to the machine that runs Jenkins, using the image from the local Docker daemon. Deploying to another host would require the role to pull the image from Docker Hub or Nexus.
- Every green build on `main` deploys. There is no manual approval step.
- Trivy does not fail the build, whatever it finds.

## Planned

See the [Roadmap](../README.md#roadmap).
