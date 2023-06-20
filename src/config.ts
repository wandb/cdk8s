import { load } from 'js-yaml'
import { schema } from './schema'
import { readFileSync } from 'fs'
import { logger } from './logger'
import { z } from 'zod'

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
  const cmdArg: any = getConfigFromArgs()
  if (cmdArg != null) return cmdArg

  logger.info(`Loading config from ${configPath}`)
  const file = readFileSync(configPath, 'utf8')
  const parser = configPath.endsWith('.json') ? JSON.parse : load
  return parser(file)
}

const pase = (): z.infer<typeof schema> => {
  const cfg = getConfig() ?? {}
  logger.info('Validating config', cfg)
  logger.info(JSON.stringify(cfg))
  try {
    return schema.parse(cfg)
  } catch (e) {
    if (e instanceof z.ZodError) {
      logger.error('Invalid config file')
      for (const issue of e.issues) {
        logger.error(`${issue.path.join('.')}: ${issue.message}`, {
          type: 'zod',
          ...issue,
        })
      }
    }
  }
  process.exit(1)
}

export const config = pase()
