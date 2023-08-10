import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import * as fs from 'fs'
import { mysqlConfig } from './mysql/config'
import { bucketConfig, ssoConfig } from './wandb/app/config'
import { redisConfig } from './redis/config'
import { generalConfig, metadataConfig } from './global/global'
import { licenseConfig } from './wandb/app/config'
import { customResource } from './global/operator'

export const schema = z
  .object({
    $schema: z.string().optional(),

    license: licenseConfig.optional(),
    namespace: z.string().default('default').optional(),

    customResource: customResource.optional(),
    operator: customResource.optional(),

    global: generalConfig.optional(),

    console: z
      .object({
        metadata: metadataConfig.optional(),
        image: z
          .object({
            repository: z.string().optional(),
            tag: z.string().optional(),
          })
          .optional(),
        operator: z
          .object({
            namespace: z.string().optional(),
          })
          .optional(),
      })
      .optional(),

    host: z.string().optional(),

    app: z
      .object({
        metadata: metadataConfig.optional(),
        image: z
          .object({
            repository: z.string().optional(),
            tag: z.string().optional(),
          })
          .optional(),
        sessionLength: z.number().default(720),
        extraEnvs: z.record(z.string()).optional(),
      })
      .optional(),

    ingress: z
      .object({
        metadata: metadataConfig.optional(),
        defaultBackend: z.literal('console').or(z.literal('app')).optional(),
      })
      .optional(),

    sso: ssoConfig.optional(),
    bucket: bucketConfig.optional(),

    // External services
    mysql: mysqlConfig.optional(),
    redis: redisConfig.optional(),
  })
  .describe('Configuration schema for generating k8s manifests')

const jsonSchema = zodToJsonSchema(schema, {
  name: 'wandb-config-cdk',
  errorMessages: true,
})

fs.writeFile(
  './config-schema.json',
  JSON.stringify(jsonSchema, null, 2),
  (err) => {
    if (err) {
      console.error(err)
    }
    // file written successfully
  },
)
