#!/usr/bin/env npx ts-node

import './src/schema'

import { App } from 'cdk8s'
import { WeightsAndBaisesChart } from './src/wandb'
import { MysqlCredentialsConfig, MysqlStatefulSetChart } from './src/mysql'
import { config } from './src/config'
import { MinioChart } from './src/minio'
import { logger } from './src/logger'
import { RedisCredentialsConfig } from './src/redis/config'
import { RedisChart } from './src/redis'

const app = new App()

const metadata = config.common?.metadata ?? {}

const getBucketCredentials = () => {
  if (config.bucket != null) {
    if (config.minio != null)
      logger.warn('Both minio and bucket are configured, using bucket')

    return config.bucket
  }

  logger.info('Creating storage container using minio')
  logger.warn(
    'Minio requires a license if you are using this in a production environment',
  )
  const mino = new MinioChart(app, 'minio', {
    disableResourceNameHashes: true,
    metadata,
    ...config.minio,
  })
  return mino.getBucket()
}

const getMysqlCredentials = (): MysqlCredentialsConfig => {
  if (config.mysql != null && 'database' in config.mysql) {
    return config.mysql
  }

  logger.info('Creating basic MySQL deployment')
  const mysqlChart = new MysqlStatefulSetChart(app, 'mysql', {
    disableResourceNameHashes: true,
    ...config.mysql,
    metadata,
  })

  return mysqlChart.getCredentials()
}

const getRedisCredentials = (): RedisCredentialsConfig => {
  if (config.redis != null && 'host' in config.redis) {
    return config.redis
  }

  logger.info('Creating basic Redis deployment')
  const redisChart = new RedisChart(app, 'redis', {
    disableResourceNameHashes: true,
    ...config.redis,
    metadata,
  })

  return redisChart.getCredentials()
}

const mysql = getMysqlCredentials()
const bucket = getBucketCredentials()
const redis = getRedisCredentials()

new WeightsAndBaisesChart(app, 'wandb', {
  disableResourceNameHashes: true,
  metadata,
  webservices: { ...config, mysql, bucket, redis },
})

app.synth()
