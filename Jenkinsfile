pipeline {
    agent any

    stages {
        stage('Checkout'){
            steps {
                checkout scm
            }
        }

        stage('Environment'){
            steps {
                sh ''' 
                    echo "PATH=$PATH"
                    node --version
                    pnpm --version
                '''
            }
        }

        stage('Install Dependencies'){
            steps {
                sh 'pnpm install --frozen-lockfile'
            }
        }

        stage('Lint'){
            steps {
                sh 'pnpm run lint'
            }
        }

        stage('Test'){
            steps {
                sh 'pnpm run test -- --runInBand'
            }
        }

         stage('Build') {
            steps {
                sh 'pnpm run build'
            }
        }
    }
}