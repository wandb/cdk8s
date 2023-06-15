import { z } from 'zod'

export const ownerReferenceConfig = z.object({
  apiVersion: z.string(),
  blockOwnerDeletion: z.boolean().optional(),
  controller: z.boolean(),
  kind: z.string(),
  name: z.string(),
  uid: z.string(),
})
