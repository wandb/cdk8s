# cdk8s

- [cdk8s](#cdk8s)
  - [Why typescript?](#why-typescript)
  - [Install](#install)
  - [cdk8s](#cdk8s-1)

## Why typescript?

- TypeScript is the primary language for AWS CDK, and cdk8s was initially
  developed in TypeScript. As a result, the documentation and community examples
  are more extensive in TypeScript.

## Install

To apply you will kind installed.

1. `pnpm i`
2. `pnpm gen`
3. `bash ./apply.sh`

## cdk8s

- `pnpm run import` Import/update k8s apis (you should check-in this directory)
- `pnpm run upgrade` Upgrade cdk8s modules to latest version
- `pnpm run upgrade:next` Upgrade cdk8s modules to latest "@next" version (last commit)
