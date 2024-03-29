#!/usr/bin/env npx ts-node

import './src/schema'

import { App } from 'cdk8s'
import { WeightsAndBiasesChart } from './src/wandb'
import { MysqlCredentialsConfig, MysqlStatefulSetChart } from './src/mysql'
import { config } from './src/config'
import { logger } from './src/logger'
import { RedisCredentialsConfig } from './src/redis/config'
import { RedisChart } from './src/redis'
import { RedisExternalChart } from './src/redis/ca-cert'

const app = new App()

const metadata = config.global?.metadata ?? {}

const getMysqlCredentials = (): MysqlCredentialsConfig => {
  if (config.mysql != null && 'database' in config.mysql) {
    return config.mysql
  }

  logger.info('Creating basic MySQL deployment')
  const mysqlChart = new MysqlStatefulSetChart(app, 'mysql', {
    disableResourceNameHashes: true,
    metadata,
    ...config.mysql,
  })

  return mysqlChart.getCredentials()
}

const getRedisCredentials = (): RedisCredentialsConfig => {
  if (config.redis != null && 'host' in config.redis) {
    new RedisExternalChart(app, 'redis', {
      disableResourceNameHashes: true,
      ...config.redis,
      metadata,
    })
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
const redis = getRedisCredentials()
const bucket = config.bucket ?? { connectionString: 'bucket://unknown' }

new WeightsAndBiasesChart(app, 'wandb', {
  disableResourceNameHashes: true,
  ...config,
  global: { ...config.global, metadata },
  prometheus: { mysql },
  app: { ...config.app, mysql, bucket, redis },
})

app.synth()
