// Test setup file - runs before each test file
import { vi } from 'vitest';

// Mock the logger to avoid console noise in tests and provide metrics
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
  metrics: {
    increment: vi.fn(),
    histogram: vi.fn(),
    timeAsync: vi.fn(async <T>(_name: string, fn: () => Promise<T>) => fn()),
    getMetrics: vi.fn(() => ({ counters: {}, histograms: {} })),
    reset: vi.fn(),
  },
  generateCorrelationId: vi.fn(() => 'test-correlation-id'),
  getCorrelationId: vi.fn(() => 'test-correlation-id'),
  withCorrelationId: vi.fn(<T>(_id: string, fn: () => T) => fn()),
}));

// Mock config for tests
vi.mock('../config', () => ({
  config: {
    env: 'test',
    port: 3001,
    mongodb: {
      uri: 'mongodb://localhost:27017/svg-processor-test',
    },
    upload: {
      directory: '/tmp/test-uploads',
      maxFileSize: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/svg+xml'],
      allowedExtensions: ['.svg'],
    },
    cors: {
      origin: '*',
    },
  },
}));
