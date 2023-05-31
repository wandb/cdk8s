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

      return NODE_ENV === 'production'
        ? `[${level}]: ${label} ${message} ${duration}`
        : `[${level}]: ${gray(label)} ${message} ${duration}`
    }),
  ]

  // We dont want colors in production. They do not display correctly in cloud
  // run console.
  if (NODE_ENV !== 'production') format.unshift(winston.format.colorize())

  return winston.createLogger({
    level,
    format: winston.format.combine(...format),
    transports: [new winston.transports.Console()],
  })
}

export const logger = createLogger(LOG_LEVEL ?? 'debug')
