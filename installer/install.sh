#!/bin/bash

set -e
set -E


DIR=.

# Scripts are inlined for distrubution. See "make join"
. $DIR/installer/common/logging.sh
. $DIR/installer/common/utils.sh
. $DIR/installer/common/kubernetes.sh
. $DIR/installer/common/semver.sh
. $DIR/installer/common/packages.sh

function main() {
    log_step "Initialize Kubernetes"

    package_download "kubeadm" "https://storage.googleapis.com/kubernetes-release/release/v1.27.2/bin/linux/amd64/kubeadm"
    package_download "kubelet" "https://storage.googleapis.com/kubernetes-release/release/v1.27.2/bin/linux/amd64/kubelet"
    package_download "kubectl" "https://storage.googleapis.com/kubernetes-release/release/v1.27.2/bin/linux/amd64/kubectl"

    printf "hello"
    printf "\n"
}

LOGS_DIR='./logs'
mkdir -p $LOGS_DIR
LOGFILE="$LOGS_DIR/install-$(date +"%Y-%m-%dT%H-%M-%S").log"

main "$@" 2>&1 | tee $LOGFILE
