import { config } from "../config";

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  child(context: string): Logger {
    return new Logger(this.context ? `${this.context}:${context}` : context);
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(this.context && { context: this.context }),
      ...(data && { data }),
      ...(error && { error: { name: error.name, message: error.message } }),
    };

    const output = config.env === "production" ? JSON.stringify(entry) : this.formatPretty(entry);
    const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    logFn(output);
  }

  private formatPretty(entry: Record<string, unknown>): string {
    const { timestamp, level, context, message, data, error } = entry;
    let output = `${timestamp} ${String(level).toUpperCase().padEnd(5)} ${context ? `[${context}] ` : ""}${message}`;
    if (data) output += ` ${JSON.stringify(data)}`;
    if (error) output += ` Error: ${(error as { message: string }).message}`;
    return output;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>, error?: Error): void {
    this.log("warn", message, data, error);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log("error", message, data, error);
  }
}

export const logger = new Logger();
export const createLogger = (context: string) => logger.child(context);
