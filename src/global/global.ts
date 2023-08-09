import { z } from 'zod'

const ownerReferencesConfig = z.object({
  apiVersion: z.string(),
  blockOwnerDeletion: z.boolean().optional(),
  controller: z.boolean(),
  kind: z.string(),
  name: z.string(),
  uid: z.string(),
})

export const metadataConfig = z.object({
  ownerReferences: z.array(ownerReferencesConfig).default([]).optional(),
  annotations: z.record(z.string()).default({}).optional(),
  labels: z.record(z.string()).default({}).optional(),
})

export const generalConfig = z.object({
  metadata: metadataConfig.optional(),
  storageClassName: z.string().optional(),
  extraEnvs: z.array(z.string()).default([]).optional(),
})

export type GeneralConfig = z.infer<typeof generalConfig>
