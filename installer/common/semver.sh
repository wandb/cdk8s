#!/bin/bash

#
#
# Example:
#
# local -a parsed
# parse_semver "1.2.3" parsed
# echo "Major: ${parsed[0]}"
# echo "Minor: ${parsed[1]}"
# echo "Patch: ${parsed[2]}"
#

# Parses a given SemVer string into major,minor, and patch version numbers and
# stores them in an indexed array with the specified prefix.
# 
# Input:
# semver - A SemVer-formatted version string (e.g., "1.2.3")
# prefix - A prefix for the indexed array variables to avoid naming conflicts
#         (e.g., "v1_parts") Output: The function updates three indexed array
#         variables with

# the given prefix, containing major, minor, and patch versions.

function parse_semver() {
  local semver="$1"
  local prefix="$2"

  local -a parsed_ver
  IFS='.' read -ra parsed_ver <<< "$semver"

  eval "${prefix}[0]=${parsed_ver[0]}"
  eval "${prefix}[1]=${parsed_ver[1]}"
  eval "${prefix}[2]=${parsed_ver[2]}"
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
