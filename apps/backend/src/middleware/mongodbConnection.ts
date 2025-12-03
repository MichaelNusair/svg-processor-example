import type { Request, Response, NextFunction } from 'express';
import { mongodbService } from '../services/mongodb.service';
import { logger } from '../utils/logger';

/**
 * Middleware to ensure MongoDB connection before handling requests
 * Attempts to reconnect if connection is lost
 */
export async function ensureMongoConnection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await mongodbService.ensureConnection();
    next();
  } catch (error) {
    logger.error('MongoDB connection failed', error as Error, {
      path: req.originalUrl,
    });
    res.status(503).json({
      error: 'ServiceUnavailable',
      message: 'Database connection unavailable',
      statusCode: 503,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }
}
