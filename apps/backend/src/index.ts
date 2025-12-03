import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config';
import { designRoutes } from './routes/designs';
import { fileService } from './services/file.service';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { logger } from './utils/logger';

const app = express();

app.use(cors({ origin: config.cors.origin }));
app.use(express.json());
app.use(requestLogger);
app.use('/uploads', express.static(config.upload.directory));

app.get('/health', (_req, res) => {
  const readyState: number = mongoose.connection.readyState;
  const isConnected = readyState === 1;
  res.json({
    status: isConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
  });
});

app.use('/designs', designRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap(): Promise<void> {
  try {
    await fileService.ensureUploadDirectory();
    await mongoose.connect(config.mongodb.uri);
    logger.info('Connected to MongoDB');

    app.listen(config.port, () => {
      logger.info(`Server running on http://localhost:${String(config.port)}`);
    });
  } catch (error) {
    logger.error('Failed to start', error as Error);
    process.exit(1);
  }
}

void bootstrap();

export default app;
