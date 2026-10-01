pipeline {
    agent any

    stages {
        
        stage('Environment') {
            steps {
                sh '''
                    echo "PATH=$PATH"
                    node --version
                    pnpm --version
                '''
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'pnpm install --frozen-lockfile'
            }
        }

        stage('Generate Prisma Client') {
            steps {
                    sh 'pnpm exec prisma generate'
            }
        }

        stage('Code Quality Checks') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'pnpm run lint'
                    }
                }
                stage('Test') {
                    steps {
                        sh 'pnpm run test --coverage --runInBand'
                    }
                }
            }
        }
        stage('Build') {
            steps {
                sh 'pnpm run build'
            }
        }
        
stage('SonarQube Analysis') {
    steps {
       sh '''
          export JAVA_HOME=/opt/homebrew/opt/openjdk@21
            export PATH=$JAVA_HOME/bin:$PATH

            java -version
                npx sonar-scanner \
                -Dsonar.host.url=http://127.0.0.1:9000 \
                -Dsonar.token=sqa_64801f31f1e77bfbcd148507fc7b0bc0c09e789c
        '''
    }
}

        stage('Docker build') {
            steps {
                sh 'DOCKER_BUILDKIT=0 docker build -t nestjs-auth:${BUILD_NUMBER} .'
            }
        }

        stage('Docker image') {
            steps {
                sh 'docker image ls nestjs-auth'
            }
        }
        stage('Docker Run') {
            steps {
                withCredentials([file(
                credentialsId: 'nestjs-env',
                variable: 'ENV_FILE'
            )]) {
                    sh '''
                    docker rm -f nestjs-auth-t || true

                    docker run -d \
                        --name nestjs-auth-t \
                        -p 4000:4000 \
                        --env-file "$ENV_FILE" \
                        nestjs-auth:${BUILD_NUMBER}
                '''
            }
            }

            post {
                always {
                    echo 'Pipeline finished'
                }

                success {
                    echo 'Pipeline succeeded ✅'
                }

                failure {
                    echo 'Pipeline failed ❌'
                }
            }
        }
    }
}
