import { config } from '../config';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage for request-scoped correlation IDs.
 * This allows us to track a request through the entire processing pipeline
 * without having to pass the correlation ID through every function call.
 */
const correlationStore = new AsyncLocalStorage<{ correlationId: string }>();

/**
 * Generate a unique correlation ID for request tracing.
 * Format: timestamp-randomhex (e.g., "1701619200000-a1b2c3d4")
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(16).substring(2, 10);
  return `${String(timestamp)}-${random}`;
}

/**
 * Get the current correlation ID from async context, or undefined if not in a request context.
 */
export function getCorrelationId(): string | undefined {
  return correlationStore.getStore()?.correlationId;
}

/**
 * Run a function with a correlation ID in the async context.
 * All logs within the callback will automatically include the correlation ID.
 */
export function withCorrelationId<T>(correlationId: string, fn: () => T): T {
  return correlationStore.run({ correlationId }, fn);
}

/**
 * Simple in-memory metrics collector.
 * In production, replace with Prometheus client or StatsD:
 * - prom-client for Prometheus: https://github.com/siimon/prom-client
 * - hot-shots for StatsD: https://github.com/brightcove/hot-shots
 */
class MetricsCollector {
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  /**
   * Increment a counter metric.
   * Production: promClient.Counter or statsd.increment()
   */
  increment(name: string, value = 1, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    const current = this.counters.get(key) ?? 0;
    this.counters.set(key, current + value);
  }

  /**
   * Record a duration/histogram metric.
   * Production: promClient.Histogram or statsd.histogram()
   */
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.buildKey(name, tags);
    const values = this.histograms.get(key) ?? [];
    values.push(value);
    this.histograms.set(key, values);
  }

  /**
   * Time an async operation and record the duration.
   */
  async timeAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      this.histogram(name, performance.now() - start, {
        ...tags,
        status: 'success',
      });
      return result;
    } catch (error) {
      this.histogram(name, performance.now() - start, {
        ...tags,
        status: 'error',
      });
      throw error;
    }
  }

  /**
   * Get all metrics (for /metrics endpoint or debugging).
   */
  getMetrics(): {
    counters: Record<string, number>;
    histograms: Record<
      string,
      { count: number; avg: number; p50: number; p95: number; p99: number }
    >;
  } {
    const counters: Record<string, number> = {};
    const histograms: Record<
      string,
      { count: number; avg: number; p50: number; p95: number; p99: number }
    > = {};

    for (const [key, value] of this.counters) {
      counters[key] = value;
    }

    for (const [key, values] of this.histograms) {
      if (values.length === 0) continue;
      const sorted = [...values].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      histograms[key] = {
        count: sorted.length,
        avg: sum / sorted.length,
        p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
        p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        p99: sorted[Math.floor(sorted.length * 0.99)] ?? 0,
      };
    }

    return { counters, histograms };
  }

  /**
   * Reset all metrics (useful for testing).
   */
  reset(): void {
    this.counters.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) return name;
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${tagStr}}`;
  }
}

export const metrics = new MetricsCollector();

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  // Standard fields for log aggregation systems
  service: string;
  environment: string;
  version: string;
}

class Logger {
  private context?: string;
  private static readonly SERVICE_NAME = 'svg-processor-backend';
  private static readonly VERSION = '1.0.0';

  constructor(context?: string) {
    this.context = context;
  }

  /**
   * Create a child logger with additional context.
   */
  child(context: string): Logger {
    return new Logger(this.context ? `${this.context}:${context}` : context);
  }

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: Logger.SERVICE_NAME,
      environment: config.env,
      version: Logger.VERSION,
    };

    // Add correlation ID if available
    const correlationId = getCorrelationId();
    if (correlationId) {
      entry.correlationId = correlationId;
    }

    // Add context if available
    if (this.context) {
      entry.context = this.context;
    }

    // Add data if available
    if (data && Object.keys(data).length > 0) {
      entry.data = data;
    }

    // Add error details if available
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: config.env !== 'production' ? error.stack : undefined,
      };
    }

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

  private formatPretty(entry: LogEntry): string {
    const { timestamp, level, context, correlationId, message, data, error } =
      entry;

    const parts: string[] = [timestamp, level.toUpperCase().padEnd(5)];

    if (correlationId) {
      parts.push(`[${correlationId}]`);
    }

    if (context) {
      parts.push(`[${context}]`);
    }

    parts.push(message);

    if (data && Object.keys(data).length > 0) {
      parts.push(JSON.stringify(data));
    }

    if (error) {
      parts.push(`Error: ${error.message}`);
      if (error.stack && config.env !== 'production') {
        parts.push(`\n${error.stack}`);
      }
    }

    return parts.join(' ');
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (config.env === 'production') return; // Skip debug in production
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
