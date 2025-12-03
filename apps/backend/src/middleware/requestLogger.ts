import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('HTTP');

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.originalUrl}`, {
      statusCode: res.statusCode,
      duration: `${String(duration)}ms`,
    });
  });

  next();
}
