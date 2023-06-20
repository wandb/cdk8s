import { z } from 'zod'

export const licenseConfig = z
  .object({
    secret: z.string(),
    key: z.string(),
    checksum: z.string().optional(),
  })
  .or(z.string())
