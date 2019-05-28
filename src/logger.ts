import { PREFIX } from './meta'

const defaultLevel = 3 // warn level
const logMethods = ['trace', 'debug', 'info', 'warn', 'error']
const noop = function() {}

function Logger() {
  const self = this

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

  self.setLevel = (level: number) => {
    replaceLogMethod.call(self, level)
  }

  replaceLogMethod.call(self, defaultLevel)
}

export const logger = new Logger()
export const LogLevels = logMethods.reduce((acc, cur, index) => {
  acc[cur] = index
  return acc
}, {})
