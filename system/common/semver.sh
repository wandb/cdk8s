#!/bin/bash

function semverParse() {
    major="${1%%.*}"
    minor="${1#$major.}"
    minor="${minor%%.*}"
    patch="${1#$major.$minor.}"
    patch="${patch%%[-.]*}"
}

SEMVER_COMPARE_RESULT=
function semverCompare() {
    semverParse "$1"
    _a_major="${major:-0}"
    _a_minor="${minor:-0}"
    _a_patch="${patch:-0}"
    semverParse "$2"
    _b_major="${major:-0}"
    _b_minor="${minor:-0}"
    _b_patch="${patch:-0}"
    if [ "$_a_major" -lt "$_b_major" ]; then
        SEMVER_COMPARE_RESULT=-1
        return
    fi
    if [ "$_a_major" -gt "$_b_major" ]; then
        SEMVER_COMPARE_RESULT=1
        return
    fi
    if [ "$_a_minor" -lt "$_b_minor" ]; then
        SEMVER_COMPARE_RESULT=-1
        return
    fi
    if [ "$_a_minor" -gt "$_b_minor" ]; then
        SEMVER_COMPARE_RESULT=1
        return
    fi
    if [ "$_a_patch" -lt "$_b_patch" ]; then
        SEMVER_COMPARE_RESULT=-1
        return
    fi
    if [ "$_a_patch" -gt "$_b_patch" ]; then
        SEMVER_COMPARE_RESULT=1
        return
    fi
    SEMVER_COMPARE_RESULT=0
}
