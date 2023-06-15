import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import * as fs from 'fs'
import { mysqlConfig } from './mysql/config'
import { bucketConfig, ssoConfig } from './wandb/webservice/config'
import { ownerReferenceConfig } from './common/owner-reference'

const metadataConfig = z.object({
  ownerReference: z.array(ownerReferenceConfig).default([]),
  annotations: z.record(z.string()).default({}),
  labels: z.record(z.string()).default({}),
})

export const schema = z
  .object({
    $schema: z.string().optional(),

    common: z
      .object({
        metadata: metadataConfig.default({}),
      })
      .default({}),

    webServices: z
      .object({
        image: z.object({
          repository: z.string(),
          tag: z.string(),
        }),
      })
      .optional(),

    minio: z
      .object({
        image: z
          .object({
            repository: z.string(),
            tag: z.string(),
          })
          .optional(),
      })
      .optional(),

    bucket: bucketConfig.optional(),

    mysql: mysqlConfig,
    sso: ssoConfig.optional(),
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
