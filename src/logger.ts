import { gray, red, yellow } from '@colors/colors/safe'
import * as winston from 'winston'
import { LEVEL } from 'triple-beam'

const { NODE_ENV, LOG_LEVEL } = process.env

function createLogger(level: string) {
  const format = [
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf((info) => {
      const { level, durationMs } = info
      const duration = durationMs != null ? `(Timer: ${durationMs}ms)` : ''
      const hasLabel = info.label != null
      const appendLabel = info.label?.length < 5 ? '    ' : ''
      const label = hasLabel ? `\t[${info.label}]${appendLabel} ` : '\t'

      const messageColor =
        info[LEVEL] === 'error'
          ? red
          : info[LEVEL] === 'warn'
          ? yellow
          : info[LEVEL] === 'debug'
          ? gray
          : (v: string) => v
      const message = messageColor(info.message)

      return `[${level}]: ${gray(label)} ${message} ${duration}`
    }),
  ]

  return winston.createLogger({
    level,
    format:
      NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(...format),
    transports: [new winston.transports.Console()],
  })
}

export const logger = createLogger(LOG_LEVEL ?? 'debug')
