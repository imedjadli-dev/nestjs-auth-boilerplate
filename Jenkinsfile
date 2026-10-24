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
        TRIVY_NO_PROGRESS = 'true'
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

        stage('Trivy image scan'){
            
            steps {
                sh '''
                 echo "Scanning image for vulnerabilities"
                 trivy image --format table --output trivy-report.txt "${IMAGE_NAME}:${IMAGE_TAG}"
                 trivy image --timeout 15m --exit-code 0 --severity HIGH,CRITICAL --ignore-unfixed "${IMAGE_NAME}:${IMAGE_TAG}"
                '''
            }

            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.txt', allowEmptyArchive: true
                }
            }
        }

       stage('Compose up & health check') {
    steps {
        withCredentials([file(credentialsId: 'nestjs-env', variable: 'ENV_FILE')]) {
            sh '''
                cp "$ENV_FILE" .env

                echo "Validating compose files"
                docker compose --profile monitoring config -q

                echo "Starting application stack"
                docker compose up -d --wait

                echo "Checking application health"
                curl --fail --silent --show-error http://localhost:4000/health
                echo "Health check passed"

                echo "Checking metrics endpoint"
                curl --fail --silent --show-error http://localhost:4000/metrics > /dev/null
                echo "Metrics endpoint OK"
            '''
        }
    }
}

    stage('check docker connectivity') {
        steps{
            sh 'curl -I https://registry-1.docker.io/v2/' 
        }
    }

stage('Push image to Docker Hub and Nexus') {
    when {
        expression { (env.BRANCH_NAME ?: env.GIT_BRANCH) ==~ /(origin\/)?main/ }
    }

    steps {
        withCredentials([
            usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER' , passwordVariable: 'DH_PASSWORD'),
            usernamePassword(credentialsId: 'nexus-creds', usernameVariable: 'NEXUS_USER' , passwordVariable: 'NEXUS_PASSWORD')
        ]) {
            parallel(
                "Nexus Push": {
                    sh '''
                    echo "Nexus User: ${NEXUS_USER}"
                    SRC="${IMAGE_NAME}:${IMAGE_TAG}"
                    echo "$NEXUS_PASSWORD" | docker login "$NEXUS_REGISTRY" -u "$NEXUS_USER" --password-stdin
                    docker tag "$SRC" "${NEXUS_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                    docker push "${NEXUS_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
                    '''
                },
                "Docker Hub Push": {
                    retry(3) {
                        timeout(time: 15, unit: 'MINUTES') {
                            sh '''
                            SRC="${IMAGE_NAME}:${IMAGE_TAG}"
                            echo "$DH_PASSWORD" | docker login -u "$DH_USER" --password-stdin
                            docker tag "$SRC" "${DH_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                            docker push "${DH_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
                            '''
                        }
                    }
                }
            )
        }
    }
}

        stage('Deploy with Ansible') {
    when {
        expression { (env.BRANCH_NAME ?: env.GIT_BRANCH) ==~ /(origin\/)?main/ }
    }
    steps {
        withCredentials([file(credentialsId: 'ansible-vars', variable: 'ANSIBLE_VARS')]) {
            sh '''
                echo "Stopping the CI verification stack"
                docker compose down -v --remove-orphans

                cd ansible
                ansible-galaxy collection install -r requirements.yml
                ansible-playbook site.yml --tags deploy \
                  -e @"$ANSIBLE_VARS" \
                  -e image_tag="${IMAGE_TAG}"
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
