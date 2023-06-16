import { load } from 'js-yaml'
import { schema } from './schema'
import { readFileSync } from 'fs'
import { logger } from './logger'

const configPath = process.env.CONFIG_FILE ?? './config.yaml'

const getConfigFromArgs = () => {
  const jsonArgIndex = process.argv.findIndex((arg) =>
    arg.startsWith('--json='),
  )

  if (jsonArgIndex !== -1) {
    logger.info('Loading config from command line argument')
    const jsonString = process.argv[jsonArgIndex].replace('--json=', '')
    return JSON.parse(jsonString)
  }
  return null
}

const getConfig = () => {
  const cmdArg = getConfigFromArgs()
  if (cmdArg != null) return config

  logger.info(`Loading config from ${configPath}`)
  const file = readFileSync(configPath, 'utf8')
  const parser = configPath.endsWith('.json') ? JSON.parse : load
  return parser(file)
}

export const config = schema.parse(getConfig() ?? {})
