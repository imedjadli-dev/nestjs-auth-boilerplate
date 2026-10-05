pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    tools {
        nodejs 'node24'
        jdk 'jdk21'
    }

    environment {
        COMPOSE_PROJECT_NAME = "nestjs-auth-${BUILD_NUMBER}"
        IMAGE_NAME = 'nestjs-auth'
        IMAGE_TAG = "${BUILD_NUMBER}"
        NEXUS_REGISTRY = '127.0.0.1:8082'
    }

    stages {
        stage('Project Setup') {
            steps {
                sh 'corepack enable && node --version && pnpm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'pnpm install --frozen-lockfile'
            }
        }

        stage('Prisma Generate') {
            steps {
                    sh 'pnpm exec prisma generate'
            }
        }

        stage('Code Quality Checks') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'pnpm run lint:ci'
                    }
                }
                stage('Test') {
                    steps {
                        sh 'pnpm run test:cov --runInBand'
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') { sh 'npx sonar-scanner' }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') { waitForQualityGate abortPipeline: true }
            }
        }

        stage('Docker build') {
            steps { sh 'docker compose build api' }
        }

        stage('Compose up & health check') {
            steps {
                withCredentials([file(credentialsId: 'nestjs-env', variable: 'ENV_FILE')]) {
                    sh '''
            cp "$ENV_FILE" .env
            echo " Staring application stack "
            docker compose up -d --wait

            echo "Checking application health "
            curl -fsS http://localhost:4000/health
          '''
                }
            }
        }

        stage('Push image to Dokcer Hub and Nexus') {
            when {
                expression { (env.BRANCH_NAME ?: env.GIT_BRANCH) ==~ /(origin\/)?main/ }
            }

            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER' , passwordVariable: 'DH_PASSWORD'),
                    usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER' , passwordVariable: 'NEXUS_PASSWORD')
                ]) {
                    sh '''
                    echo "$DH_PASSWORD" | docker login -u "$DH_USER" --password-stdin
                    echo "$NEXUS_PASSWORD" | docker login "$NEXUS_REGISTRY" -u "$NEXUS_USER" --password-stdin
                    SRC="${IMAGE_NAME}:${IMAGE_TAG}"
                    for TARGET in "${DH_USER}/${IMAGE_NAME}" "${NEXUS_REGISTRY}/${IMAGE_NAME}"; do
                        docker tag "$SRC" "$TARGET:${IMAGE_TAG}"
                        docker tag "$SRC" "$TARGET:latest"
                        docker push "$TARGET:${IMAGE_TAG}"
                        docker push "$TARGET:latest"
                        done
                     '''
                }
            }
        }
    }

    post {
        always {
            sh '''
        docker compose logs --tail=100 || true
        docker compose down -v --remove-orphans || true
        docker logout || true
        docker logout "$NEXUS_REGISTRY" || true
        rm -f .env
      '''
            cleanWs()
        }
        success { echo 'Pipeline succeeded' }
        failure { echo 'Pipeline failed' }
    }
}
