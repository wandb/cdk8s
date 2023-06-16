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
  port: z.string(),

  image: imageSettings,
})

export type RedisCredentialsConfig = z.infer<typeof redisCredentialsConfig>

export const managedRedisConfig = z.object({ image: imageSettings })
export type RedisManagedConfig = z.infer<typeof managedRedisConfig>

export const redisConfig = redisCredentialsConfig.or(managedRedisConfig)
export type RedisConfig = z.infer<typeof redisConfig>
