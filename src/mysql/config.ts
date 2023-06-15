import { z } from 'zod'

export const mysqlCredentialConfig = z.object({
  host: z.string(),
  port: z.number(),
  user: z.string(),
  database: z.string(),
  password: z
    .object({
      secret: z.string(),
      key: z.string(),
      checksum: z.string().optional(),
    })
    .or(z.string()),
})

export type MysqlCredentialsConfig = z.infer<typeof mysqlCredentialConfig>

export const managedMysqlConfig = z.object({
  image: z
    .object({
      repository: z.string().default('wandb/local'),
      tag: z.string().default('latest'),
    })
    .optional(),
  password: z
    .object({
      secret: z.string(),
      key: z.string(),
      checksum: z.string().optional(),
    })
    .or(z.string())
    .optional(),
})

export type MysqlManagedConfig = z.infer<typeof managedMysqlConfig>

export const mysqlConfig = mysqlCredentialConfig.or(managedMysqlConfig)
export type MysqlConfig = z.infer<typeof mysqlConfig>
