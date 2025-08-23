import pino from 'pino'
import pretty from 'pino-pretty'

export class LoggerProvider {
  private pino: pino.Logger

  constructor(private readonly logLevel: boolean) {
    this.pino = pino(
      {
        level: this.logLevel ? 'debug' : 'info',
      },
      pretty({
        colorize: true,
        translateTime: 'SYS:standard',
      }),
    )
  }

  private hasBeenInitialized = false

  get hasBeenInitializedValue() {
    return this.hasBeenInitialized
  }

  get level() {
    return this.logLevel
  }

  /**
   * @description ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️ !IMPORTANT! Before using the logger, it must be initialized with this method at the top of the entry point file of a service.
   */
  init() {
    this.pino.info('LoggerProvider initialized')
    this.hasBeenInitialized = true
  }

  noInitLog(message: string) {
    this.pino.info(message)
  }

  info(message: string, ...args: unknown[]) {
    this._checkInit()
    this.pino.info(args, message)
  }

  debug(message: string, ...args: unknown[]) {
    this._checkInit()
    this.pino.debug(args, message)
  }

  warning(message: string, ...args: unknown[]) {
    this._checkInit()
    this.pino.warn(args, message)
  }

  error(message: string, error?: unknown, ..._args: unknown[]) {
    this._checkInit()
    const args = typeof Bun !== 'undefined' ? Bun.inspect(_args) : _args
    this.pino.error({ err: error, args }, message)
  }

  private _checkInit() {
    if (!this.hasBeenInitialized) {
      throw new Error('LoggerProvider has not been initialized')
    }
  }
}
