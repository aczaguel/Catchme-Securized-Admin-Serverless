@Library("security-tools")_
pipeline {
    agent {
        label 'jenkins-ecs-build-be'
    }
    environment {
        Channel = 'devops-sandbox'
        Branch = "${env.BRANCH_NAME}"
        Name = 'Tapit-BE-Client'
        Repo = 'Tapit-BE-Client'
        ChangeBranch = "${env.CHANGE_BRANCH}"
        ChangeTarget = "${env.CHANGE_TARGET}"
    }
    stages {
        stage('Install Node Dependencies') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'release'
                    branch 'pre-prod'
                    branch 'master'
                    changeRequest()
                }
            }
            steps {
                nodejs('NODEJS') {
                    sh 'node -v && npm -v'
                    sh 'npm install'
                    sh 'serverless plugin install -n serverless-plugin-include-dependencies'
                }
            }
        }
        stage('Running Mocha Unit Test') {
            when {
                anyOf {
                    branch 'dev'
                    branch 'release'
                    branch 'pre-prod'
                    branch 'master'
                    // changeRequest()
                }
            }
            steps {
                nodejs('NODEJS') {
                    sh 'npm run test'
                    sh 'npm run coverage'
                    sh 'npm run coverage:report'
                }
            }
        }
        stage("Security Scans"){
            parallel {
                stage('Gitleaks') {
                    when {
                        changeRequest()
                    }
                    steps {
                        script{
                            securityTools.gitleaks()
                        }
                        
                    }
                }
                stage("Snyk scan") {
                    when {
                        changeRequest()
                    }
                    steps {
                        script{
                            securityTools.snyk()
                        }
                    }
                }
                stage("Checkmarx scan") {
                    when {
                        changeRequest()
                    }
                    steps {
                        script{
                            checkmarx("${Repo}")
                        }
                    }
                }

                stage("Sonar scan") {
                    when {
                        anyOf {
                            branch 'dev'
                            branch 'release'
                            branch 'pre-prod'
                            branch 'master'
                            changeRequest()
                        }
                    }
                    steps {
                        script{
                            if (Branch =~ /(PR\-[0-9]+\b)/ ){
                                securityTools.sonar_pr("${Branch}", "${Repo}","${ChangeBranch}", "${ChangeTarget}")
                            }else{
                                securityTools.sonar_branch("${Branch}", "${Repo}")
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy Dev') {
            when {
                anyOf{
                    branch 'dev'
                }
            }

            parallel {
                stage('COLOMBIA') {
                    steps {
                        script {
                            // COLOMBIA
                            client.dev_colombia()
                        }
                    }
                }
                stage('USA') {
                    steps {
                        script {
                            // USA
                            client.dev_usa()
                        }
                    }
                }

                stage('BRAZIL') {
                    steps {
                        script {
                            // BRAZIL
                            client.dev_brazil()
                        }
                    }
                }
                /*
                This is commented because of this project will be launched later
                stage('BELGIUM') {
                    steps {
                        script {
                            // BELGIUM
                            client.dev_belgium()
                        }
                    }
                }*/
                stage('MEXICO') {
                    steps {
                        script {
                            // MEXICO
                            client.dev_mexico()
                        }
                    }
                }
            }
        }
        stage('Deploy QA') {
            when {
                branch 'release'
            }
            parallel {
                stage('COLOMBIA') {
                    steps {
                        script {
                            // COLOMBIA
                            client.qa_colombia()
                        }
                    }
                }
                stage('USA') {
                    steps {
                        script {
                            // USA
                            client.qa_usa()
                        }
                    }
                }

                stage('BRAZIL') {
                    steps {
                        script {
                            // BRAZIL
                            client.qa_brazil()
                        }
                    }
                }
                // stage('BELGIUM') {
                //     steps {
                //         script {
                //             // BELGIUM
                //             client.qa_belgium()
                //         }
                //     }
                // }
                stage('MEXICO') {
                    steps {
                        script {
                            // MEXICO
                            client.qa_mexico()
                        }
                    }
                }
            }
        }
        stage('Deploy Pre-Prod') {
            when {
                branch 'pre-prod'
            }
            parallel {
                stage('USA') {
                    steps {
                        script {
                            // USA
                            client.pre_prod_usa()
                        }
                    }
                }
            }
        }
        
        stage('Deploy Prod') {
            when {
                branch 'master'
            }
            parallel {
                stage('COLOMBIA') {
                    steps {
                        script {
                            // COLOMBIA
                            client.prod_colombia()
                        }
                    }
                }
                stage('USA') {
                    steps {
                        script {
                            // USA
                            client.prod_usa()
                        }
                    }
                }

                stage('BRAZIL') {
                    steps {
                        script {
                            // BRAZIL
                            client.prod_brazil()

                        }
                    }
                }
                // stage('BELGIUM') {
                //     steps {
                //         script {
                //             // BELGIUM
                //             client.prod_belgium()
                //         }
                //     }
                // }
                stage('MEXICO') {
                    steps {
                        script {
                            // MEXICO
                            client.prod_mexico()
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            slackSend botUser: true,
            channel: 'devops-sandbox',
            message: "<${env.BUILD_URL}|${env.JOB_NAME} - ${env.BUILD_NUMBER}>\n Execution successfully",
            color: 'good',
            tokenCredentialId: 'slack-token'
        }
        failure {
            slackSend botUser: true,
            channel: 'devops-sandbox',
            message: "<${env.BUILD_URL}|${env.JOB_NAME} - ${env.BUILD_NUMBER}>\n Execution failed",
            color: 'danger',
            tokenCredentialId: 'slack-token'
        }
    }
}
