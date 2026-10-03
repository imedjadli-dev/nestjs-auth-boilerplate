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
            docker compose up -d --wait
            curl -fsS http://localhost:4000/health
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
        rm -f .env
      '''
            cleanWs()
        }
        success { echo 'Pipeline succeeded' }
        failure { echo 'Pipeline failed' }
    }
}
