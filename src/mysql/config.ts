import { EnvValue, Secret } from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { z } from 'zod'

export const mysqlAuthConfig = z.object({
  host: z.string(),
  port: z.number().default(3306),
  password: z.object({
    secret: z.string(),
    key: z.string(),
  }),
  user: z.string(),
  database: z.string(),
})

export type MysqlAuthConfig = z.infer<typeof mysqlAuthConfig>

export const configToEnv = (scope: Construct, config: MysqlAuthConfig) => {
  const { database, user, password, host, port = 3306 } = config
  return {
    DATABASE: EnvValue.fromValue(database),
    DATABASE_HOST: EnvValue.fromValue(host),
    DATABASE_USER: EnvValue.fromValue(user),
    DATABASE_PORT: EnvValue.fromValue(port.toString()),
    DATABASE_PASSWORD: EnvValue.fromSecretValue({
      secret: Secret.fromSecretName(scope, 'database-secret', password.secret),
      key: password.key,
    }),
    MYSQL: EnvValue.fromValue(
      'mysql://$(DATABASE_USER):$(DATABASE_PASSWORD)@$(DATABASE_HOST):$(DATABASE_PORT)/$(DATABASE)',
    ),
  } as const
}
