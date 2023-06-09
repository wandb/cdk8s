# cdk8s

- [cdk8s](#cdk8s)
  - [Why typescript?](#why-typescript)
  - [Commands](#commands)

## Why typescript?

- TypeScript is the primary language for AWS CDK, and cdk8s was initially
  developed in TypeScript. As a result, the documentation and community examples
  are more extensive in TypeScript.

## Commands

Compile:

- `npm run compile` Compile typescript code to javascript (or "yarn watch")
- `npm run watch` Watch for changes and compile typescript in the background
- `npm run build` Compile + synth

Synthesize:

- `npm run synth` Synthesize k8s manifests from charts to dist/ (ready for 'kubectl apply -f')

Deploy:

- `kubectl apply -f dist/`

Upgrades:

- `npm run import` Import/update k8s apis (you should check-in this directory)
- `npm run upgrade` Upgrade cdk8s modules to latest version
- `npm run upgrade:next` Upgrade cdk8s modules to latest "@next" version (last commit)
