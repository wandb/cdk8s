#!/bin/bash

function kubernetes_install_packages() {
    k8sVersion=$1

    logStep "Install kubelet, kubectl and cni host packages"
    if kubernetes_host_commands_ok "$k8sVersion"; then
        logSuccess "Kubernetes host packages already installed"
        return
    fi
}

function kubernetes_has_packages() {
    local k8sVersion=$1

    if ! commandExists kubelet; then
        printf "kubelet command missing - will install host components\n"
        return 1
    fi
    if ! commandExists kubeadm; then
        printf "kubeadm command missing - will install host components\n"
        return 1
    fi
    if ! commandExists kubectl; then
        printf "kubectl command missing - will install host components\n"
        return 1
    fi
    if ! ( PATH=$PATH:/usr/local/bin; commandExists kustomize ); then
        printf "kustomize command missing - will install host components\n"
        return 1
    fi
    if ! commandExists crictl; then
        printf "crictl command missing - will install host components\n"
        return 1
    fi

    # Check we have the proper versions installed
    local currentCrictlVersion=$(crictl --version | grep -Eo '[0-9]+\.[0-9]+\.[0-9]+')
    semverCompare "$currentCrictlVersion" "$CRICTL_VERSION"
    if [ "$SEMVER_COMPARE_RESULT" = "-1" ]; then
        printf "crictl command upgrade available - will install host components\n"
        return 1
    fi

    kubelet --version | grep -q "$k8sVersion"
}