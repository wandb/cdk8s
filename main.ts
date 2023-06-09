#!/usr/bin/env npx ts-node

import './src/schema'

import { App } from 'cdk8s'
import { WeightsAndBaisesChart } from './src/wandb'

const app = new App()

new WeightsAndBaisesChart(app, 'wandb', { disableResourceNameHashes: true })

app.synth()
