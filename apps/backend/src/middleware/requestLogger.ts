import type { Request, Response, NextFunction } from 'express';
import { createLogger, metrics } from '../utils/logger';

const logger = createLogger('HTTP');

/**
 * Express middleware for structured request logging with metrics.
 *
 * Logs:
 * - Request start (method, path, query, user agent)
 * - Request completion (status code, duration)
 *
 * Metrics:
 * - http_requests_total: Counter of total requests by method, path, status
 * - http_request_duration_ms: Histogram of request durations
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = performance.now();
  const { method, originalUrl, query } = req;

  const normalizedPath = normalizePath(originalUrl);

  logger.info('Request started', {
    method,
    path: originalUrl,
    query: Object.keys(query).length > 0 ? query : undefined,
    userAgent: req.get('user-agent'),
  });

  res.on('finish', () => {
    const duration = performance.now() - startTime;
    const { statusCode } = res;
    const statusCategory = getStatusCategory(statusCode);

    logger.info('Request completed', {
      method,
      path: originalUrl,
      statusCode,
      durationMs: Math.round(duration * 100) / 100,
    });

    metrics.increment('http_requests_total', 1, {
      method,
      path: normalizedPath,
      status: String(statusCode),
      status_category: statusCategory,
    });

    metrics.histogram('http_request_duration_ms', duration, {
      method,
      path: normalizedPath,
      status_category: statusCategory,
    });
  });

  next();
}

/**
 * Normalize URL path for metrics to avoid high cardinality.
 * Replaces dynamic segments (IDs) with placeholders.
 */
function normalizePath(url: string): string {
  // Remove query string
  const path = url.split('?')[0] ?? url;

  // Replace MongoDB ObjectId-like strings with :id
  // ObjectId: 24 hex characters
  return path.replace(/\/[a-f0-9]{24}/gi, '/:id');
}

/**
 * Categorize HTTP status codes for metrics grouping.
 */
function getStatusCategory(statusCode: number): string {
  if (statusCode < 200) return '1xx';
  if (statusCode < 300) return '2xx';
  if (statusCode < 400) return '3xx';
  if (statusCode < 500) return '4xx';
  return '5xx';
}
