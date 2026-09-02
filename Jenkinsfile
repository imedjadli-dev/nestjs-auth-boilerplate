pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment') {
            steps {
                sh '''
                    echo "PATH=$PATH"
                    node --version
                    pnpm --version
                    java -version
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

        pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment') {
            steps {
                sh '''
                    echo "PATH=$PATH"
                    node --version
                    pnpm --version
                    java -version
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

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}


        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}
