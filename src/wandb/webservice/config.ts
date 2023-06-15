import { EnvValue } from 'cdk8s-plus-26'
import { z } from 'zod'

export const oidcConfig = z.object({
  clientId: z.string(),
  issuer: z.string(),
  method: z.literal('implicit').or(z.literal('pkce')).default('implicit'),
})

export type OidcConfig = z.infer<typeof oidcConfig>

export const bucketConfig = z.object({
  connectionString: z.string(),
  region: z.string().default('').optional(),
  kmsKey: z.string().default('').optional(),
})

export type BucketConfig = z.infer<typeof bucketConfig>

export const bucketConfigToEnv = (
  config: BucketConfig,
): Record<string, EnvValue> => {
  return {
    BUCKET: EnvValue.fromValue(config.connectionString),
    AWS_REGION: EnvValue.fromValue(config.region ?? ''),
    AWS_S3_KMS_ID: EnvValue.fromValue(config.kmsKey ?? ''),
  }
}

export const ssoConfig = z.object({
  oidc: oidcConfig.optional(),
  ldap: z.object({}).optional(),
})
export type SsoConfig = z.infer<typeof ssoConfig>

export const ssoConfigToEnv = (sso: SsoConfig): Record<string, EnvValue> => {
  return {
    ...(sso.oidc != null
      ? {
          OIDC_CLIENT_ID: EnvValue.fromValue(sso.oidc?.clientId ?? ''),
          OIDC_ISSUER: EnvValue.fromValue(sso.oidc?.issuer ?? ''),
          OIDC_AUTH_METHOD: EnvValue.fromValue(sso.oidc?.method ?? ''),
        }
      : {}),
    ...(sso.ldap != null ? {} : {}),
  }
}
