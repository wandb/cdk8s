import { load } from 'js-yaml'
import { schema } from './schema'
import { readFileSync } from 'fs'

const configPath = process.env.CONFIG_FILE ?? './config.yaml'

export const config = schema.parse(load(readFileSync(configPath, 'utf8')))
