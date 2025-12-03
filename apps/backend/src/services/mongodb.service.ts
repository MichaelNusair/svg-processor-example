import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../utils/logger';

// Mongoose connection states enum
const ConnectionState = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3,
} as const;

class MongoDBService {
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  /**
   * Ensures MongoDB connection is active, reconnects if necessary
   * @returns Promise that resolves when connection is ready
   */
  async ensureConnection(): Promise<void> {
    // Connection states: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const readyState: number = mongoose.connection.readyState;

    if (readyState === ConnectionState.CONNECTED) {
      // Already connected
      return;
    }

    // If already connecting, wait for that connection attempt
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // Start new connection attempt
    this.isConnecting = true;
    this.connectionPromise = this.connect();

    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async connect(): Promise<void> {
    try {
      const readyState: number = mongoose.connection.readyState;
      if (
        readyState === ConnectionState.DISCONNECTED ||
        readyState === ConnectionState.DISCONNECTING
      ) {
        logger.info('Attempting to connect to MongoDB...');
        await mongoose.connect(config.mongodb.uri);
        logger.info('Connected to MongoDB');
      }
    } catch (error) {
      logger.error('Failed to connect to MongoDB', error as Error);
      throw error;
    }
  }

  /**
   * Initial connection on app startup
   */
  async initialize(): Promise<void> {
    // Set up connection event handlers
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (error: Error) => {
      logger.error('MongoDB connection error', error);
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    await this.ensureConnection();
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    const readyState: number = mongoose.connection.readyState;
    return readyState === ConnectionState.CONNECTED;
  }
}

export const mongodbService = new MongoDBService();
