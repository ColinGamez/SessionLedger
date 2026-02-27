type LogLevel = 'info' | 'warn' | 'error'

interface LogMeta {
  [key: string]: unknown
}

function log(level: LogLevel, msg: string, meta?: LogMeta) {
  const entry = JSON.stringify({
    level,
    msg,
    ...meta,
    ts: new Date().toISOString(),
  })

  if (level === 'error') {
    console.error(entry)
  } else if (level === 'warn') {
    console.warn(entry)
  } else {
    // info — suppressed in production to reduce noise; use a log drain instead
    if (process.env.NODE_ENV !== 'production') {
      console.error(entry) // console.log is disallowed by eslint rule; use error in dev only
    }
  }
}

export const logger = {
  info: (msg: string, meta?: LogMeta) => log('info', msg, meta),
  warn: (msg: string, meta?: LogMeta) => log('warn', msg, meta),
  error: (msg: string, meta?: LogMeta) => log('error', msg, meta),
}
