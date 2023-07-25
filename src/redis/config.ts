import { z } from 'zod'

// This is also used when doing init containers
const imageSettings = z
  .object({
    repository: z.string().optional(),
    tag: z.string().optional(),
  })
  .optional()

export const redisCredentialsConfig = z.object({
  host: z.string(),
  port: z.number(),
  user: z.string().optional(),
  password: z
    .object({
      secret: z.string(),
      key: z.string(),
      checksum: z.string().optional(),
    })
    .or(z.string())
    .optional(),

  caCert: z.string().optional(),
  params: z.record(z.any()).optional(),

  image: imageSettings,
})

export type RedisCredentialsConfig = z.infer<typeof redisCredentialsConfig>

export const managedRedisConfig = z.object({ image: imageSettings })
export type RedisManagedConfig = z.infer<typeof managedRedisConfig>

export const redisConfig = redisCredentialsConfig.or(managedRedisConfig)
export type RedisConfig = z.infer<typeof redisConfig>
