pipeline {
    agent any

    environment {
        PROJECT_NAME       = "meet_vote"
        BRANCH_NAME        = "main"
        REPO_URL           = "https://github.com/Mkw68Mkw/meet_vote.git"
        SONAR_SCANNER_OPTS = "-Xmx512m"
        NODE_OPTIONS       = "--max-old-space-size=384"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: BRANCH_NAME,
                    url: REPO_URL
            }
        }

        stage('SonarQube Analysis') {
            steps {
                sh """
                    echo "Starting SonarQube analysis of $PROJECT_NAME"
                    echo "SONAR_SCANNER_OPTS=$SONAR_SCANNER_OPTS"
                    echo "NODE_OPTIONS=$NODE_OPTIONS"
                """
                script {
                    def scannerHome = tool 'sonar-scanner'
                    withSonarQubeEnv('SonarQube') {
                        sh """
                        ${scannerHome}/bin/sonar-scanner \
                          -Dsonar.projectKey=${PROJECT_NAME} \
                          -Dsonar.projectName=${PROJECT_NAME} \
                          -Dsonar.sources=my-app,backend \
                          -Dsonar.exclusions=**/node_modules/**,**/.next/**,**/__pycache__/**,**/*.db \
                          -Dsonar.python.version=3.11 \
                          -Dsonar.typescript.tsconfigPaths=my-app/tsconfig.sonar.json
                        """
                    }
                }
            }
        }
    }
}
