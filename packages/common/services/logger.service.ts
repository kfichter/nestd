import * as clc from 'cli-color'
import { Service, Optional } from '../decorators'
import { NestdEnvironment } from '../enums/nestd-environment.enum'
import { isObject } from '../utils/shared.utils'

declare const process

export interface LoggerService {
  log(message: any, context?: string)
  error(message: any, trace?: string, context?: string)
  warn(message: any, context?: string)
}

@Service()
export class Logger implements LoggerService {
  private static prevTimestamp?: number
  private static contextEnvironment = NestdEnvironment.RUN
  private static logger?: typeof Logger | LoggerService = Logger
  private static readonly yellow = clc.xterm(3)

  constructor(
    @Optional() private readonly context?: string,
    @Optional() private readonly isTimeDiffEnabled = false,
  ) {}

  log(message: any, context?: string): void {
    const { logger } = Logger
    if (logger === this) {
      Logger.log(message, context || this.context, this.isTimeDiffEnabled)
      return
    }
    logger && logger.log.call(logger, message, context || this.context)
  }

  error(message: any, trace = '', context?: string): void {
    const { logger } = Logger
    if (logger === this) {
      Logger.error(message, trace, context || this.context)
      return
    }
    logger &&
      logger.error.call(logger, message, trace, context || this.context)
  }

  warn(message: any, context?: string): void {
    const { logger } = Logger
    if (logger === this) {
      Logger.warn(message, context || this.context, this.isTimeDiffEnabled)
      return
    }
    logger && logger.warn.call(logger, message, context || this.context)
  }

  static overrideLogger(logger: LoggerService | boolean): void {
    this.logger = logger ? (logger as LoggerService) : undefined
  }

  static setMode(mode: NestdEnvironment): void {
    this.contextEnvironment = mode
  }

  static log(message: any, context = '', isTimeDiffEnabled = true): void {
    this.printMessage(message, clc.green, context, isTimeDiffEnabled)
  }

  static error(
    message: any,
    trace = '',
    context = '',
    isTimeDiffEnabled = true,
  ): void {
    this.printMessage(message, clc.red, context, isTimeDiffEnabled)
    this.printStackTrace(trace)
  }

  static warn(message: any, context = '', isTimeDiffEnabled = true): void {
    this.printMessage(message, clc.yellow, context, isTimeDiffEnabled)
  }

  protected static isActive(): boolean {
    return Logger.contextEnvironment !== NestdEnvironment.TEST
  }

  private static printMessage(
    message: any,
    color: (message: string) => string,
    context: string = '',
    isTimeDiffEnabled?: boolean,
  ): void {
    if (!this.isActive()) {
      return
    }
    const output = isObject(message) ? JSON.stringify(message, null, 2) : message
    process.stdout.write(color(`[Nest] ${process.pid}   - `))
    process.stdout.write(`${new Date(Date.now()).toLocaleString()}   `)

    context && process.stdout.write(this.yellow(`[${context}] `))
    process.stdout.write(color(output))

    this.printTimestamp(isTimeDiffEnabled)
    process.stdout.write(`\n`)
  }

  private static printTimestamp(isTimeDiffEnabled?: boolean): void {
    const includeTimestamp = Logger.prevTimestamp && isTimeDiffEnabled
    if (includeTimestamp) {
      process.stdout.write(
        this.yellow(` +${Date.now() - Logger.prevTimestamp}ms`),
      )
    }
    Logger.prevTimestamp = Date.now()
  }

  private static printStackTrace(trace: string): void {
    if (!this.isActive() || !trace) {
      return
    }
    process.stdout.write(trace)
    process.stdout.write(`\n`)
  }
}