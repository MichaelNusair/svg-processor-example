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
    let readyState: number = mongoose.connection.readyState;

    if (readyState === ConnectionState.CONNECTED) {
      // Already connected
      return;
    }

    // If already connecting via our service, wait for that connection attempt
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // If mongoose is already connecting, wait for it with a simple polling approach
    if (readyState === ConnectionState.CONNECTING) {
      const startTime = Date.now();
      const timeout = 10000; // 10 second timeout

      while (Date.now() - startTime < timeout) {
        readyState = mongoose.connection.readyState;
        if (readyState === ConnectionState.CONNECTED) {
          return;
        }
        if (readyState === ConnectionState.DISCONNECTED) {
          break; // Connection failed, will try to reconnect below
        }
        // Wait 100ms before checking again
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // If still connecting after timeout, throw error
      const finalState: number = mongoose.connection.readyState;
      if (finalState === ConnectionState.CONNECTING) {
        throw new Error('MongoDB connection timeout');
      }
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
