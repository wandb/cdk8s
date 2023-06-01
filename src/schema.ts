import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import * as fs from 'fs'
import { mysqlAuthConfig } from './mysql/config'

/**
 * Defining schema for defining the database
 */
export const database = z
  .object({ managed: z.boolean().default(true) })
  .or(mysqlAuthConfig)

export const schema = z
  .object({
    $schema: z.string().optional(),

    database: database.optional(),
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
