import { Construct } from 'constructs'
import {
  ConfigMap,
  ContainerProps,
  EnvValue,
  Secret,
  Volume,
  VolumeMount,
} from 'cdk8s-plus-26'
import { RedisCredentialsConfig } from './config'
import { stringify } from 'querystring'
import { redisCaCertConfigMap } from './ca-cert'

export const REDIS_DEFAULT_REPOSITORY = 'redis'
export const REDIS_DEFAULT_TAG = '6'
export const REDIS_CERTIFICATE_FILE_NAME = 'redis_ca.pem'
export const REDIS_CERTIFICATE_DIR = `/etc/ssl/certs`
export const REDIS_CERTIFICATE_PATH = `${REDIS_CERTIFICATE_DIR}/${REDIS_CERTIFICATE_FILE_NAME}`

export const canConnectToRedis = (
  scope: Construct,
  config: RedisCredentialsConfig,
  volume: Volume | null,
): ContainerProps => {
  const repository = config.image?.repository ?? REDIS_DEFAULT_REPOSITORY
  const tag = config.image?.tag ?? REDIS_DEFAULT_TAG
  const command = ['redis-cli', '-p', '$(REDIS_PORT)', '-h', '$(REDIS_HOST)']
  if (config.caCert != null)
    command.push('--tls', '--cacert', REDIS_CERTIFICATE_PATH)

  if (config.password != null)
    command.push('-a', '$(REDIS_PASSWORD)')

  return {
    name: 'check-redis',
    image: `${repository}:${tag}`,
    securityContext: {
      ensureNonRoot: false,
      allowPrivilegeEscalation: true,
      readOnlyRootFilesystem: false,
    },
    volumeMounts: [...redisCertMount(scope, `redis-ca-cert`, volume)],
    envVariables: {
      ...redisConfigToEnv(scope, `init-check`, config),
    },
    command: [
      '/bin/sh',
      '-c',
      `until ${command.join(
        ' ',
      )} ping; do echo "Waiting for Redis connection..."; sleep 5; done`,
    ],
  }
}

export const redisConfigToEnv = (
  scope: Construct,
  id: string,
  config: RedisCredentialsConfig,
): Record<string, EnvValue> => {
  let connectionString =
    config.password == null
      ? `redis://$(REDIS_HOST):$(REDIS_PORT)`
      : `redis://$(REDIS_USER):$(REDIS_PASSWORD)@$(REDIS_HOST):$(REDIS_PORT)`

  let connectionStringWithParams = connectionString
  let params = stringify(config.params)
  if (params.length > 0) {
    params = '?' + params
    connectionStringWithParams += '$(REDIS_PARAMETERS)'
  }

  return {
    REDIS_PARAMETERS: EnvValue.fromValue(params),
    REDIS_USER: EnvValue.fromValue(config.user ?? ''),
    REDIS_PASSWORD:
      typeof config.password === 'string' || config.password == null
        ? EnvValue.fromValue(config.password ?? '')
        : EnvValue.fromSecretValue({
          secret: Secret.fromSecretName(
            scope,
            `${scope.node.id}-${id}-redis-password`,
            config.password.secret,
          ),
          key: config.password.key,
        }),
    REDIS_HOST: EnvValue.fromValue(config.host),
    REDIS_PORT: EnvValue.fromValue(config.port.toString()),
    REDIS: EnvValue.fromValue(connectionStringWithParams),
    REDIS_URI: EnvValue.fromValue(connectionString),
  }
}

export const redisCertVolume = (
  scope: Construct,
  id: string,
): Volume | null => {
  return redisCaCertConfigMap == null
    ? null
    : Volume.fromConfigMap(
      scope,
      id,
      ConfigMap.fromConfigMapName(
        scope,
        `${scope.node.id}-${id}`,
        redisCaCertConfigMap,
      ),
    )
}

export const redisCertMount = (
  scope: Construct,
  id: string,
  volume: Volume | null,
): VolumeMount[] => {
  if (redisCaCertConfigMap == null) return []
  return volume == null
    ? [
      {
        readOnly: true,
        path: REDIS_CERTIFICATE_DIR,
        subPath: REDIS_CERTIFICATE_FILE_NAME,
        volume: Volume.fromConfigMap(
          scope,
          id,
          ConfigMap.fromConfigMapName(
            scope,
            `${scope.node.id}-${id}`,
            redisCaCertConfigMap,
          ),
        ),
      },
    ]
    : [{
      readOnly: true,
      path: REDIS_CERTIFICATE_PATH,
      subPath: REDIS_CERTIFICATE_FILE_NAME,
      volume
    }]
}
