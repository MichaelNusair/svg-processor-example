import type { Request, Response, NextFunction } from 'express';
import { generateCorrelationId, withCorrelationId } from '../utils/logger';

// Standard header for correlation ID propagation
const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Express middleware that establishes a correlation ID context for each request.
 *
 * - Uses existing correlation ID from request header if present (for distributed tracing)
 * - Generates a new correlation ID if not present
 * - Sets the correlation ID in response header for client visibility
 * - Wraps the entire request handling in async context for automatic logging
 *
 * All downstream code can access the correlation ID via getCorrelationId()
 * without explicitly passing it through function parameters.
 */
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Use existing correlation ID from header or generate new one
  const correlationId =
    (req.headers[CORRELATION_ID_HEADER] as string) || generateCorrelationId();

  // Set correlation ID in response header for client visibility
  res.setHeader(CORRELATION_ID_HEADER, correlationId);

  // Attach to request for explicit access if needed
  (req as Request & { correlationId: string }).correlationId = correlationId;

  // Run the rest of the request handling within the correlation context
  withCorrelationId(correlationId, () => {
    next();
  });
}
