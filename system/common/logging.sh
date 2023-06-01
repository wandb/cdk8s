#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;94m'
LIGHT_BLUE='\033[0;34m'

function logSuccess() {
    printf "${GREEN}✔ $1${NC}\n" 1>&2
}

function log() {
    printf "%s\n" "$1" 1>&2
}

function logStep() {
    printf "${BLUE}⚙  $1${NC}\n" 1>&2
}

function logSubstep() {
    printf "\t${LIGHT_BLUE}- $1${NC}\n" 1>&2
}

function logFail() {
    printf "${RED}$1${NC}\n" 1>&2
}

function logWarn() {
    printf "${YELLOW}$1${NC}\n" 1>&2
}

function bail() {
    logFail "$@"
    exit 1
}