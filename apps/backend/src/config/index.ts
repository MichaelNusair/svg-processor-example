import path from 'path';

export const config = {
  env: (process.env.NODE_ENV ?? 'development') as
    | 'development'
    | 'production'
    | 'test',
  port: parseInt(process.env.PORT ?? '3001', 10),

  mongodb: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/svg-processor',
  },

  upload: {
    directory: process.env.UPLOAD_DIR ?? path.join(__dirname, '../../uploads'),
    maxFileSize: parseInt(
      process.env.MAX_FILE_SIZE ?? String(5 * 1024 * 1024),
      10
    ),
    allowedMimeTypes: ['image/svg+xml'],
    allowedExtensions: ['.svg'],
  },

  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
  },
} as const;
