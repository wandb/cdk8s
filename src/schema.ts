import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import * as fs from 'fs'
import { mysqlConfig } from './mysql/config'
import { bucketConfig, ssoConfig } from './wandb/webservice/config'

const imageConfig = z.object({
  repository: z.string(),
  tag: z.string().default('latest'),
})

export const schema = z
  .object({
    $schema: z.string().optional(),
    webServices: z
      .object({
        image: imageConfig,
      })
      .optional(),
    mysql: mysqlConfig,
    bucket: bucketConfig,
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
