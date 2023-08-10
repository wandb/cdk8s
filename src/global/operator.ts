import { z } from 'zod'

export const operator = z.object({
  namespace: z.string().optional(),
})

export type Operator = z.infer<typeof operator>

export const customResource = z.object({
  name: z.string().optional(),
  namespace: z.string().optional(),
  apiVersion: z.string().optional(),
})

export type CustomResource = z.infer<typeof customResource>
