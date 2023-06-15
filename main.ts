#!/usr/bin/env npx ts-node

import './src/schema'

import { App } from 'cdk8s'
import { WeightsAndBaisesChart } from './src/wandb'
import { MysqlCredentialsConfig, MysqlStatefulSetChart } from './src/mysql'
import { config } from './src/config'
import { MinioChart } from './src/minio'

const app = new App()

const getBucketCredentials = () => {
  if (config.bucket != null) {
    return config.bucket
  }

  const mino = new MinioChart(app, 'minio', {
    disableResourceNameHashes: true,
    metadata: config.common.metadata,
    image: config.minio?.image,
  })
  return mino.getBucket()
}

const getMysqlCredentials = (): MysqlCredentialsConfig => {
  if ('database' in config.mysql) {
    return config.mysql
  }

  const mysqlChart = new MysqlStatefulSetChart(app, 'mysql', {
    disableResourceNameHashes: true,
    ...config.mysql,
    metadata: config.common.metadata,
  })

  return mysqlChart.getCredentials()
}

const mysql = getMysqlCredentials()
const bucket = getBucketCredentials()

new WeightsAndBaisesChart(app, 'wandb', {
  disableResourceNameHashes: true,
  webservices: { ...config, mysql, bucket },
})

app.synth()
