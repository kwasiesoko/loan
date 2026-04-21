pipeline {
    agent {
        label "docker3"
    }
    environment {
        DOCKERHUB_CRED      = credentials('DOCKERHUB_CRED')
        REG_AML_CRED        = credentials('REG_AML_CRED')
        USER_CREDENTIALS    = credentials('dev-swarm-manager-user-password')
        SERVICE             = "loan"
        STACK               = "test"
        registry_URL        = "reg-aml.esoko.com"

        // Dev images
        IMAGE_BACKEND       = "reg-aml.esoko.com/develop.esoko/loan-backend"
        IMAGE_WEB           = "reg-aml.esoko.com/develop.esoko/loan-web"
        TAG                 = "alpha"

        // Prod images
        imageName_BACKEND   = "reg-aml.esoko.com/deveops-test.img/loan-backend"
        imageName_WEB       = "reg-aml.esoko.com/deveops-test.img/loan-web"

        imageTag            = "${env.BUILD_ID}"
    }

    triggers {
        githubPush()
    }

    stages {

        stage('Init Environment') {
            steps {
                script {
                    env.TAG_NAME = sh(script: "git tag --points-at=HEAD || echo 'none'", returnStdout: true).trim()
                    echo "TAG_NAME = ${env.TAG_NAME}"
                }
            }
        }

        stage("Trivy Repo Scan") {
            steps {
                script {
                    echo "Running Trivy File System Scan (pre-build)..."
                    sh """
                        mkdir -p trivy-reports

                        docker run --rm \
                          -v \$(pwd):/src \
                          -v \$(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 fs /src \
                          --exit-code 0 \
                          --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL \
                          --format json \
                          --output /reports/trivy-fs-report.json

                        docker run --rm \
                          -v \$(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 convert \
                          --format template --template "@/contrib/html.tpl" \
                          --output /reports/trivy-fs-report.html \
                          /reports/trivy-fs-report.json
                    """
                }
            }
            post {
                always {
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'trivy-reports',
                        reportFiles: 'trivy-fs-report.html',
                        reportName: 'Trivy Repo (FS) Scan'
                    ])
                    archiveArtifacts artifacts: 'trivy-reports/trivy-fs-report.*', fingerprint: true
                }
            }
        }

        stage("Build and Push - Dev") {
            when {
                anyOf { branch 'develop'; branch 'loan'; branch 'Sprint*'; branch 'Hotfix*'; branch 'master'; branch 'main'; branch 'sprint*'; branch 'feature/*'; branch 'cicd-feature/*' }
            }
            steps {
                sh "echo '${REG_AML_CRED_PSW}' | docker login -u ${REG_AML_CRED_USR} --password-stdin ${registry_URL}"
            }
        }

        stage("Build and Push - Dev (parallel)") {
            when {
                anyOf { branch 'develop'; branch 'loan'; branch 'Sprint*'; branch 'Hotfix*'; branch 'master'; branch 'main'; branch 'sprint*'; branch 'feature/*'; branch 'cicd-feature/*' }
            }
            parallel {
                stage("Backend") {
                    steps {
                        sh "docker build -f backend/Dockerfile -t ${env.IMAGE_BACKEND}:${env.TAG} ."
                        sh "docker push ${env.IMAGE_BACKEND}:${env.TAG}"
                    }
                }
                stage("Web") {
                    steps {
                        sh "docker build -f frontend/Dockerfile -t ${env.IMAGE_WEB}:${env.TAG} ."
                        sh "docker push ${env.IMAGE_WEB}:${env.TAG}"
                    }
                }
            }
        }

        stage("Prune after Dev build") {
            when {
                anyOf { branch 'develop'; branch 'loan'; branch 'Sprint*'; branch 'Hotfix*'; branch 'master'; branch 'main'; branch 'sprint*'; branch 'feature/*'; branch 'cicd-feature/*' }
            }
            steps {
                sh "docker system prune -f"
            }
        }

        stage("Trivy Image Scan Dev") {
            when {
                anyOf { branch 'develop'; branch 'loan'; branch 'Sprint*'; branch 'Hotfix*'; branch 'master'; branch 'main'; branch 'sprint*'; branch 'feature/*'; branch 'cicd-feature/*' }
            }
            steps {
                script {
                    echo "Running Trivy Image Scan (post-build)..."
                    sh """
                        mkdir -p trivy-reports

                        # ── Backend image ──────────────────────────────────────────
                        docker run --rm \
                          -v /var/run/docker.sock:/var/run/docker.sock \
                          -v \$(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 image \
                          --username ${REG_AML_CRED_USR} \
                          --password ${REG_AML_CRED_PSW} \
                          --exit-code 0 \
                          --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL \
                          --format json \
                          --output /reports/trivy-backend-image-report.json \
                          ${env.IMAGE_BACKEND}:${env.TAG}

                        docker run --rm \
                          -v \$(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 convert \
                          --format template --template "@/contrib/html.tpl" \
                          --output /reports/trivy-backend-image-report.html \
                          /reports/trivy-backend-image-report.json

                        # ── Web image ──────────────────────────────────────────────
                        docker run --rm \
                          -v /var/run/docker.sock:/var/run/docker.sock \
                          -v \$(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 image \
                          --username ${REG_AML_CRED_USR} \
                          --password ${REG_AML_CRED_PSW} \
                          --exit-code 0 \
                          --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL \
                          --format json \
                          --output /reports/trivy-web-image-report.json \
                          ${env.IMAGE_WEB}:${env.TAG}

                        docker run --rm \
                          -v \$(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 convert \
                          --format template --template "@/contrib/html.tpl" \
                          --output /reports/trivy-web-image-report.html \
                          /reports/trivy-web-image-report.json
                    """
                }
            }
            post {
                always {
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'trivy-reports',
                        reportFiles: 'trivy-backend-image-report.html',
                        reportName: 'Trivy Image Scan - Backend'
                    ])
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'trivy-reports',
                        reportFiles: 'trivy-web-image-report.html',
                        reportName: 'Trivy Image Scan - Web'
                    ])
                    archiveArtifacts artifacts: 'trivy-reports/trivy-backend-image-report.*,trivy-reports/trivy-web-image-report.*', fingerprint: true

                    script {
                        def counts = [backend: [c: 0, h: 0, m: 0], web: [c: 0, h: 0, m: 0]]
                        ['backend', 'web'].each { svc ->
                            try {
                                counts[svc].c = sh(script: "jq '[.Results[] | select(.Vulnerabilities != null) | .Vulnerabilities[] | select(.Severity==\"CRITICAL\")] | length' trivy-reports/trivy-${svc}-image-report.json 2>/dev/null || echo 0", returnStdout: true).trim().toInteger()
                                counts[svc].h = sh(script: "jq '[.Results[] | select(.Vulnerabilities != null) | .Vulnerabilities[] | select(.Severity==\"HIGH\")] | length' trivy-reports/trivy-${svc}-image-report.json 2>/dev/null || echo 0", returnStdout: true).trim().toInteger()
                                counts[svc].m = sh(script: "jq '[.Results[] | select(.Vulnerabilities != null) | .Vulnerabilities[] | select(.Severity==\"MEDIUM\")] | length' trivy-reports/trivy-${svc}-image-report.json 2>/dev/null || echo 0", returnStdout: true).trim().toInteger()
                            } catch (Exception e) {
                                echo "Warning: Could not count ${svc} vulnerabilities: ${e.message}"
                            }
                        }

                        def totalCritical = counts.backend.c + counts.web.c
                        def totalHigh     = counts.backend.h + counts.web.h
                        def totalMedium   = counts.backend.m + counts.web.m

                        def color  = (totalCritical > 0) ? '#FF0000' : (totalHigh > 0) ? '#FFA500' : (totalMedium > 0) ? '#FFD700' : '#36a64f'
                        def status = (totalCritical > 0) ? '*CRITICAL VULNERABILITIES FOUND*' : (totalHigh > 0) ? 'High severity vulnerabilities found' : (totalMedium > 0) ? 'Medium severity vulnerabilities found' : 'No critical, high, or medium vulnerabilities'
                        def branchName = env.GIT_BRANCH ?: sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()

                        // slackSend(
                        //     color: color,
                        //     message: """
                        //     *Security Scan Completed for* `${env.SERVICE} - ${branchName}`
                        //     ${status}
                        //
                        //     *Backend:* CRITICAL: ${counts.backend.c} | HIGH: ${counts.backend.h} | MEDIUM: ${counts.backend.m}
                        //     *Web:*     CRITICAL: ${counts.web.c} | HIGH: ${counts.web.h} | MEDIUM: ${counts.web.m}
                        //
                        //     📊 [Backend Report](${env.BUILD_URL}Trivy_Image_Scan_-_Backend/) | [Web Report](${env.BUILD_URL}Trivy_Image_Scan_-_Web/)
                        //     """.stripIndent(),
                        //     channel: '#devops-notify'
                        // )
                    }
                }
            }
        }

        stage("Build - prod") {
            when { tag "v*" }
            parallel {
                stage("Backend") {
                    steps {
                        sh "docker build -f backend/Dockerfile -t ${env.imageName_BACKEND}:${env.TAG_NAME} ."
                    }
                }
                stage("Web") {
                    steps {
                        sh "docker build -f frontend/Dockerfile -t ${env.imageName_WEB}:${env.TAG_NAME} ."
                    }
                }
            }
        }

        stage("Trivy Image Scan - PROD") {
            when { tag "v*" }
            steps {
                script {
                    echo "Running Trivy Image Scan for PROD images..."
                    sh """
                        mkdir -p trivy-reports

                        # ── Backend ────────────────────────────────────────────────
                        docker run --rm \
                          -v /var/run/docker.sock:/var/run/docker.sock \
                          -v \$(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 image \
                          --exit-code 0 \
                          --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL \
                          --format json \
                          --output /reports/trivy-prod-backend-image-report.json \
                          ${env.imageName_BACKEND}:${env.TAG_NAME}

                        docker run --rm \
                          -v \$(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 convert \
                          --format template --template "@/contrib/html.tpl" \
                          --output /reports/trivy-prod-backend-image-report.html \
                          /reports/trivy-prod-backend-image-report.json

                        # ── Web ────────────────────────────────────────────────────
                        docker run --rm \
                          -v /var/run/docker.sock:/var/run/docker.sock \
                          -v \$(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 image \
                          --exit-code 0 \
                          --severity UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL \
                          --format json \
                          --output /reports/trivy-prod-web-image-report.json \
                          ${env.imageName_WEB}:${env.TAG_NAME}

                        docker run --rm \
                          -v \$(pwd)/trivy-reports:/reports \
                          reg-aml.esoko.com/develop.esoko/trivy:0.69.3 convert \
                          --format template --template "@/contrib/html.tpl" \
                          --output /reports/trivy-prod-web-image-report.html \
                          /reports/trivy-prod-web-image-report.json
                    """
                }
            }
            post {
                always {
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'trivy-reports',
                        reportFiles: 'trivy-prod-backend-image-report.html',
                        reportName: 'Trivy PROD Image Scan - Backend'
                    ])
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'trivy-reports',
                        reportFiles: 'trivy-prod-web-image-report.html',
                        reportName: 'Trivy PROD Image Scan - Web'
                    ])
                    archiveArtifacts artifacts: 'trivy-reports/trivy-prod-backend-image-report.*,trivy-reports/trivy-prod-web-image-report.*', fingerprint: true

                    script {
                        def counts = [backend: [c: 0, h: 0, m: 0], web: [c: 0, h: 0, m: 0]]
                        ['backend', 'web'].each { svc ->
                            try {
                                counts[svc].c = sh(script: "jq '[.Results[] | select(.Vulnerabilities != null) | .Vulnerabilities[] | select(.Severity==\"CRITICAL\")] | length' trivy-reports/trivy-prod-${svc}-image-report.json 2>/dev/null || echo 0", returnStdout: true).trim().toInteger()
                                counts[svc].h = sh(script: "jq '[.Results[] | select(.Vulnerabilities != null) | .Vulnerabilities[] | select(.Severity==\"HIGH\")] | length' trivy-reports/trivy-prod-${svc}-image-report.json 2>/dev/null || echo 0", returnStdout: true).trim().toInteger()
                                counts[svc].m = sh(script: "jq '[.Results[] | select(.Vulnerabilities != null) | .Vulnerabilities[] | select(.Severity==\"MEDIUM\")] | length' trivy-reports/trivy-prod-${svc}-image-report.json 2>/dev/null || echo 0", returnStdout: true).trim().toInteger()
                            } catch (Exception e) {
                                echo "Warning: Could not count ${svc} vulnerabilities: ${e.message}"
                            }
                        }

                        def totalCritical = counts.backend.c + counts.web.c
                        def totalHigh     = counts.backend.h + counts.web.h
                        def totalMedium   = counts.backend.m + counts.web.m

                        def color  = (totalCritical > 0) ? '#FF0000' : (totalHigh > 0) ? '#FFA500' : (totalMedium > 0) ? '#FFD700' : '#36a64f'
                        def status = (totalCritical > 0) ? '*CRITICAL VULNERABILITIES FOUND*' : (totalHigh > 0) ? 'High severity vulnerabilities found' : (totalMedium > 0) ? 'Medium severity vulnerabilities found' : 'No critical, high, or medium vulnerabilities'

                        // slackSend(
                        //     color: color,
                        //     message: """
                        //     *Security Scan Completed for PROD Images* `${env.SERVICE}:${env.TAG_NAME}`
                        //     ${status}
                        //
                        //     *Backend:* CRITICAL: ${counts.backend.c} | HIGH: ${counts.backend.h} | MEDIUM: ${counts.backend.m}
                        //     *Web:*     CRITICAL: ${counts.web.c} | HIGH: ${counts.web.h} | MEDIUM: ${counts.web.m}
                        //
                        //     📊 [Backend Report](${env.BUILD_URL}Trivy_PROD_Image_Scan_-_Backend/) | [Web Report](${env.BUILD_URL}Trivy_PROD_Image_Scan_-_Web/)
                        //     """.stripIndent(),
                        //     channel: '#devops-notify'
                        // )
                    }
                }
            }
        }

        stage("release") {
            when { tag "v*" }
            steps {
                sh "echo '${REG_AML_CRED_PSW}' | docker login -u ${REG_AML_CRED_USR} --password-stdin ${registry_URL}"
                sh "docker push ${env.imageName_BACKEND}:${env.TAG_NAME}"
                sh "docker push ${env.imageName_WEB}:${env.TAG_NAME}"
            }
        }
    }

    post {
        // success {
        //     script {
        //         slackSend(
        //             color: '#00FF00',
        //             message: "Build succeeded: ${currentBuild.fullDisplayName}",
        //             channel: '#devops-notify'
        //         )
        //     }
        // }
        // failure {
        //     script {
        //         slackSend(
        //             color: '#FF0000',
        //             message: "Build FAILED: ${currentBuild.fullDisplayName}\nLogs: ${env.BUILD_URL}",
        //             channel: '#devops-notify'
        //         )
        //     }
        // }
        always {
            cleanWs(
                cleanWhenNotBuilt: false,
                deleteDirs: true,
                disableDeferredWipeout: true,
                notFailBuild: true,
                patterns: [[pattern: '.gitignore', type: 'INCLUDE'],
                           [pattern: '.propsfile', type: 'EXCLUDE']]
            )
        }
    }
}
