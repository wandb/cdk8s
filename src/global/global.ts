import { z } from 'zod'

const ownerReferenceConfig = z.object({
  apiVersion: z.string(),
  blockOwnerDeletion: z.boolean().optional(),
  controller: z.boolean(),
  kind: z.string(),
  name: z.string(),
  uid: z.string(),
})

const metadataConfig = z.object({
  ownerReference: z.array(ownerReferenceConfig).default([]),
  annotations: z.record(z.string()).default({}),
  labels: z.record(z.string()).default({}),
})

export const generalConfig = z.object({
  metadata: z
    .object({
      metadata: metadataConfig.optional(),
      storageClassName: z.string().optional(),
    })
    .optional(),
})

export type GeneralConfig = z.infer<typeof generalConfig>
