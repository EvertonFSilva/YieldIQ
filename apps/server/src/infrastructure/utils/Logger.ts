import pino from 'pino';
import { environment } from '../../config/env';

export const logger = pino({
  level: environment.LOG_LEVEL,
  transport:
    environment.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
          }
        }
      : undefined
});

export class LoggerUtils {
  public static info(message: string, ...parameters: any[]): void {
    logger.info(message, ...parameters);
  }

  public static warn(message: string, ...parameters: any[]): void {
    logger.warn(message, ...parameters);
  }

  public static error(message: string, errorInstance?: any, contextInformation?: string): void {
    if (contextInformation) {
      logger.error({ err: errorInstance, context: contextInformation }, message);
    } else {
      logger.error({ err: errorInstance }, message);
    }
  }

  public static debug(message: string, ...parameters: any[]): void {
    logger.debug(message, ...parameters);
  }
}
