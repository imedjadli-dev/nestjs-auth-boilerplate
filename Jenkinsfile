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
                withEnv(["PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"]) {

                sh ''' 
                    echo "PATH=$PATH"
                    node --version
                    pnpm --version
                '''
            }
        }
    }  
        stage('Install Dependencies'){
            steps {
            withEnv(["PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"]) {
                sh 'pnpm install --frozen-lockfile'
            }
        }
}   

        stage('Lint'){
            steps {
            withEnv(["PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"]) {
                sh 'pnpm run lint'
            }
          }
     }
        stage('Test'){
            steps {
                 withEnv(["PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"]) {
                sh 'pnpm run test -- --runInBand'
            }
        }
    }
         stage('Build') {
            steps {
                withEnv(["PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"]) {
                sh 'pnpm run build'
            }
        }
    }
    }
}