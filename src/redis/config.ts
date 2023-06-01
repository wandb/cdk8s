import { z } from 'zod'

export const redisAuthConfig = z.object({
  host: z.string(),
  port: z.number().default(3306),
  password: z.object({
    secret: z.string(),
    key: z.string(),
  }),
  user: z.string(),
  database: z.string(),
})
