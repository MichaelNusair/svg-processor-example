import { config } from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  child(context: string): Logger {
    return new Logger(this.context ? `${this.context}:${context}` : context);
  }

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(this.context && { context: this.context }),
      ...(data && { data }),
      ...(error && { error: { name: error.name, message: error.message } }),
    };

    const output =
      config.env === 'production'
        ? JSON.stringify(entry)
        : this.formatPretty(entry);
    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      // Logger utility - console.log is intentional for info/debug output
      // eslint-disable-next-line no-console
      console.log(output);
    }
  }

  private formatPretty(entry: Record<string, unknown>): string {
    const { timestamp, level, context, message, data, error } = entry;
    const contextStr = context ? `[${JSON.stringify(context)}] ` : '';
    let output = `${String(timestamp)} ${String(level).toUpperCase().padEnd(5)} ${contextStr}${String(message)}`;
    if (data) {
      output += ` ${JSON.stringify(data)}`;
    }
    if (error) {
      const errorObj = error as { message?: string };
      const errorMessage = errorObj.message ?? JSON.stringify(error);
      output += ` Error: ${errorMessage}`;
    }
    return output;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>, error?: Error): void {
    this.log('warn', message, data, error);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('error', message, data, error);
  }
}

export const logger = new Logger();
export const createLogger = (context: string): Logger => logger.child(context);
