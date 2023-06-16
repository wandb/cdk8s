import { ContainerProps, EnvValue, Secret } from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { MysqlCredentialsConfig } from './config'

export const mysqlConfigToEnv = (
  scope: Construct,
  id: string,
  config: MysqlCredentialsConfig,
): Record<string, EnvValue> => {
  return {
    MYSQL_DATABASE: EnvValue.fromValue(config.database),
    MYSQL_HOST: EnvValue.fromValue(config.host),
    MYSQL_PORT: EnvValue.fromValue(config.port.toString()),
    MYSQL_USER: EnvValue.fromValue(config.user),
    MYSQL_ROOT_PASSWORD:
      typeof config.password === 'string'
        ? EnvValue.fromValue(config.password)
        : EnvValue.fromSecretValue({
            secret: Secret.fromSecretName(
              scope,
              `${scope.node.id}-${id}-mysql-password-root`,
              config.password.secret,
            ),
            key: config.password.key,
          }),
    MYSQL_PASSWORD:
      typeof config.password === 'string'
        ? EnvValue.fromValue(config.password)
        : EnvValue.fromSecretValue({
            secret: Secret.fromSecretName(
              scope,
              `${scope.node.id}-${id}-mysql-password`,
              config.password.secret,
            ),
            key: config.password.key,
          }),
    MYSQL: EnvValue.fromValue(
      'mysql://$(MYSQL_USER):$(MYSQL_PASSWORD)@$(MYSQL_HOST):$(MYSQL_PORT)/$(MYSQL_DATABASE)',
    ),
  }
}

export const canConnectToDatabase = (
  scope: Construct,
  image: string,
  config: MysqlCredentialsConfig,
): ContainerProps => {
  return {
    name: 'check-db',
    image,
    securityContext: {
      ensureNonRoot: false,
      allowPrivilegeEscalation: true,
      readOnlyRootFilesystem: false,
    },
    envVariables: { ...mysqlConfigToEnv(scope, 'init-check', config) },
    command: [
      'bash',
      '-c',
      'until mysql -h$MYSQL_HOST -p$MYSQL_PORT -u$MYSQL_USER -p$MYSQL_PASSWORD -D$MYSQL_DATABASE --execute="SELECT 1"; do echo waiting for db; sleep 2; done',
    ],
  }
}
