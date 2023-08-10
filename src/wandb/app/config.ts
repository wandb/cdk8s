import { EnvValue, Secret } from 'cdk8s-plus-26'
import { Construct } from 'constructs'
import { z } from 'zod'

export const licenseConfig = z
  .object({
    secret: z.string(),
    key: z.string(),
    checksum: z.string().optional(),
  })
  .or(z.string())

export type LicenseConfig = z.infer<typeof licenseConfig>

export const oidcConfig = z.object({
  clientId: z.string(),
  issuer: z.string(),
  method: z.literal('implicit').or(z.literal('pkce')).default('implicit'),
})

export type OidcConfig = z.infer<typeof oidcConfig>

export const bucketConfig = z.object({
  connectionString: z
    .object({
      secret: z.string(),
      key: z.string(),
      checksum: z.string().optional(),
    })
    .or(z.string())
    .default(''),
  region: z.string().default('').optional(),
  kmsKey: z.string().default('').optional(),
})

export type BucketConfig = z.infer<typeof bucketConfig>

export const bucketConfigToEnv = (
  scope: Construct,
  id: string,
  config: BucketConfig,
): Record<string, EnvValue> => {
  return {
    BUCKET:
      typeof config.connectionString === 'string'
        ? EnvValue.fromValue(config.connectionString)
        : EnvValue.fromSecretValue({
            secret: Secret.fromSecretName(
              scope,
              `${scope.node.id}-${id}-mysql-password-root`,
              config.connectionString.secret,
            ),
            key: config.connectionString.key,
          }),
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
          GORILLA_OIDC_CLIENT_ID: EnvValue.fromValue(sso.oidc?.clientId ?? ''),
          OIDC_ISSUER: EnvValue.fromValue(sso.oidc?.issuer ?? ''),
          GORILLA_OIDC_ISSUER: EnvValue.fromValue(sso.oidc?.issuer ?? ''),
          OIDC_AUTH_METHOD: EnvValue.fromValue(sso.oidc?.method ?? ''),
        }
      : {}),
    ...(sso.ldap != null ? {} : {}),
  }
}
