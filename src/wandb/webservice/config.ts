import { z } from 'zod'

export const oidcConfig = z.object({
  clientId: z.string(),
  issuer: z.string(),
  method: z.literal('implicit').or(z.literal('pkce')).default('implicit'),
})

export type OidcConfig = z.infer<typeof oidcConfig>

export const bucketConfig = z.object({
  bucket: z.string(),
  bucketRegion: z.string().optional(),
  bucketKmsKey: z.string().optional(),
})

export type BucketConfig = z.infer<typeof bucketConfig>

export const webServiceConfig = z.object({
  sso: z.object({
    oidc: oidcConfig.optional(),
    ldap: z.object({}).optional(),
  }),
  enableAdminApi: z.boolean().default(false),
})
export type WebServiceConfig = z.infer<typeof webServiceConfig>
