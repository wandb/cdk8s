import { EnvValue, Secret } from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { z } from 'zod'

const mysqlBaseConfig = z.object({
  host: z.string(),
  port: z.number(),
  user: z.string(),
  database: z.string(),
})

export const mysqlConfig = z
  .object({
    password: z.object({
      secret: z.string(),
      key: z.string(),
    }),
  })
  .and(mysqlBaseConfig)

export type MysqlConfig = z.infer<typeof mysqlConfig>

export const mysqlConfigToEnv = (
  scope: Construct,
  config: MysqlConfig,
): Record<string, EnvValue> => {
  return {
    DATABASE: EnvValue.fromValue(config.database),
    DATABASE_HOST: EnvValue.fromValue(config.host),
    DATABASE_PORT: EnvValue.fromValue(config.port.toString()),
    DATABASE_USER: EnvValue.fromValue(config.user),
    DATABASE_PASSWORD: EnvValue.fromSecretValue({
      secret: Secret.fromSecretName(
        scope,
        'mysql-password',
        config.password.secret,
      ),
      key: config.password.key,
    }),
    MYSQL: EnvValue.fromValue('mysql://'),
  }
}
