#!/bin/bash

set -e
set -E

INSTALLER_DIR='./wandb'

SCRIPTS=.

# Scripts are inlined for distrubution. See "make join"
. $SCRIPTS/common/logging.sh
. $SCRIPTS/common/utils.sh
. $SCRIPTS/common/kubernetes.sh
. $SCRIPTS/common/semver.sh

function main() {
    logStep "Initialize Kubernetes"

    printf "hello"
    printf "\n"
}

mkdir -p $INSTALLER_DIR

LOGFILE="$INSTALLER_DIR/install-$(date +"%Y-%m-%dT%H-%M-%S").log"

main "$@" 2>&1 | tee $LOGFILE
