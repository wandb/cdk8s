import { Construct } from 'constructs'
import { ContainerProps, EnvValue } from 'cdk8s-plus-26'
import { RedisCredentialsConfig } from './config'

export const REDIS_DEFAULT_REPOSITORY = 'redis'
export const REDIS_DEFAULT_TAG = '6'

export const canConnectToRedis = (
  scope: Construct,
  config: RedisCredentialsConfig,
): ContainerProps => {
  const repository = config.image?.repository ?? REDIS_DEFAULT_REPOSITORY
  const tag = config.image?.tag ?? REDIS_DEFAULT_TAG
  return {
    name: 'check-redis',
    image: `${repository}:${tag}`,
    securityContext: {
      ensureNonRoot: false,
      allowPrivilegeEscalation: true,
      readOnlyRootFilesystem: false,
    },
    envVariables: { ...redisConfigToEnv(scope, 'init-check', config) },
    command: [
      '/bin/sh',
      '-c',
      'until redis-cli -h $REDIS_HOST -p $REDIS_PASSWORD ping; do echo "Waiting for Redis connection..."; sleep 5; done',
    ],
  }
}

export const redisConfigToEnv = (
  _scope: Construct,
  _id: string,
  config: RedisCredentialsConfig,
): Record<string, EnvValue> => {
  return {
    REDIS_HOST: EnvValue.fromValue(config.host),
    REDIS_PORT: EnvValue.fromValue(config.port),
    REDIS: EnvValue.fromValue(`redis://$(REDIS_HOST):$(REDIS_PORT)`),
  }
}
