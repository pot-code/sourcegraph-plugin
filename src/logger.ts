import { PREFIX } from './meta'

const defaultLevel = 3 // warn level
const logMethods = ['trace', 'debug', 'info', 'warn', 'error']
const noop = function() {}

type LoggerTypes = 'trace' | 'debug' | 'info' | 'warn' | 'error'
type LogLevels = { [levelName in LoggerTypes]: number }

interface ILogger {
  trace(message?: any, ...optionalParams: any[]): void
  debug(message?: any, ...optionalParams: any[]): void
  info(message?: any, ...optionalParams: any[]): void
  warn(message?: any, ...optionalParams: any[]): void
  error(message?: any, ...optionalParams: any[]): void
  setLevel: (level: number) => void
}

class Logger {
  setLevel: (level: number) => void
  constructor() {
    function replaceLogMethod(level: number) {
      logMethods.forEach((methodName, index) => {
        this[methodName] =
          index < level
            ? noop
            : console[methodName === 'debug' ? 'log' : methodName].bind(
                console,
                `[${PREFIX}][${methodName.toUpperCase()}]:`
              )
      })
    }
    this.setLevel = (level: number) => {
      replaceLogMethod.call(this, level)
    }

    replaceLogMethod.call(this, defaultLevel)
  }
}

export const logger = new Logger() as ILogger

export const LogLevels = logMethods.reduce((acc, cur, index) => {
  acc[cur] = index
  return acc
}, {}) as LogLevels
