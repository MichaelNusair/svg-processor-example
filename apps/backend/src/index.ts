import express from 'express';
import cors from 'cors';
import { config } from './config';
import { designRoutes } from './routes/designs';
import { fileService } from './services/file.service';
import { mongodbService } from './services/mongodb.service';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { correlationIdMiddleware } from './middleware/correlationId';
import { ensureMongoConnection } from './middleware/mongodbConnection';
import { logger, metrics } from './utils/logger';

const app: express.Application = express();

app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

app.use(correlationIdMiddleware);
app.use(requestLogger);

app.use('/uploads', express.static(config.upload.directory));

app.get('/health', (_req, res) => {
  const isConnected = mongodbService.isConnected();
  res.json({
    status: isConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks: {
      mongodb: isConnected ? 'connected' : 'disconnected',
    },
  });
});

// Metrics endpoint for observability
// Production: Use Prometheus client with /metrics endpoint
app.get('/metrics', (_req, res) => {
  const metricsData = metrics.getMetrics();
  res.json({
    timestamp: new Date().toISOString(),
    ...metricsData,
  });
});

app.use('/designs', ensureMongoConnection, designRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap(): Promise<void> {
  try {
    await fileService.ensureUploadDirectory();
    await mongodbService.initialize();

    app.listen(config.port, () => {
      logger.info(`Server running on http://localhost:${String(config.port)}`, {
        port: config.port,
        environment: config.env,
      });
    });
  } catch (error) {
    logger.error('Failed to start', error as Error);
    process.exit(1);
  }
}

void bootstrap();

export default app;
