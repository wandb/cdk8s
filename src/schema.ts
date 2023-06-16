import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import * as fs from 'fs'
import { mysqlConfig } from './mysql/config'
import { bucketConfig, ssoConfig } from './wandb/webservice/config'
import { ownerReferenceConfig } from './common/owner-reference'
import { minioConfig } from './minio/config'
import { redisConfig } from './redis/config'

const metadataConfig = z.object({
  ownerReference: z.array(ownerReferenceConfig).default([]),
  annotations: z.record(z.string()).default({}),
  labels: z.record(z.string()).default({}),
})

export const schema = z
  .object({
    $schema: z.string().optional(),

    namespace: z.string().default('default').optional(),

    common: z
      .object({
        metadata: metadataConfig.default({}),
      })
      .default({})
      .optional(),

    webServices: z
      .object({
        image: z.object({
          repository: z.string(),
          tag: z.string(),
        }),
      })
      .optional(),

    sso: ssoConfig.optional(),
    bucket: bucketConfig.optional(),

    // External services
    minio: minioConfig.optional(),
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
