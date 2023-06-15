import { EnvValue, Secret } from 'cdk8s-plus-26'
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
