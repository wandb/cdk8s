import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import * as fs from 'fs'
import { mysqlConfig } from './mysql/config'
import { bucketConfig, ssoConfig } from './wandb/webservice/config'
import { redisConfig } from './redis/config'
import { generalConfig } from './global/global'
import { licenseConfig } from './wandb/webservice/config'

export const schema = z
  .object({
    $schema: z.string().optional(),

    license: licenseConfig.optional(),
    namespace: z.string().default('default').optional(),

    global: generalConfig.optional(),

    webServices: z
      .object({
        image: z.object({
          repository: z.string(),
          tag: z.string(),
        }),
      })
      .optional(),

    sso: ssoConfig.optional(),
    bucket: bucketConfig,

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
