import type { ApiError } from '@svg-processor/shared-types';

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error class for API errors with additional context.
 * Preserves error details from the backend for better error handling.
 */
export class ApiRequestError extends Error {
  readonly statusCode: number;
  readonly errorType: string;
  readonly isNotFound: boolean;
  readonly isValidationError: boolean;
  readonly isServerError: boolean;
  readonly isNetworkError: boolean;
  readonly timestamp: string;
  readonly path?: string;

  constructor(
    message: string,
    statusCode: number,
    errorType = 'Unknown',
    path?: string
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.isNotFound = statusCode === 404;
    this.isValidationError = statusCode === 400 || statusCode === 422;
    this.isServerError = statusCode >= 500;
    this.isNetworkError = statusCode === 0;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }

  /**
   * Create from API error response.
   */
  static fromApiError(apiError: ApiError): ApiRequestError {
    return new ApiRequestError(
      apiError.message,
      apiError.statusCode,
      apiError.error,
      apiError.path
    );
  }

  /**
   * Create from network/fetch error.
   */
  static fromNetworkError(): ApiRequestError {
    return new ApiRequestError(
      'Network error: Unable to connect to server. Please check your connection.',
      0,
      'NetworkError'
    );
  }

  /**
   * Get user-friendly error message based on error type.
   */
  getUserMessage(): string {
    if (this.isNetworkError) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (this.isNotFound) {
      return 'The requested resource was not found. It may have been deleted.';
    }

    if (this.isValidationError) {
      return this.message;
    }

    if (this.isServerError) {
      return 'An unexpected server error occurred. Please try again later.';
    }

    return this.message;
  }
}

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Check if an error is an ApiRequestError.
 */
export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

/**
 * Check if an error is a 404 Not Found error.
 */
export function isNotFoundError(error: unknown): boolean {
  return isApiRequestError(error) && error.isNotFound;
}

/**
 * Check if an error is a validation error.
 */
export function isValidationError(error: unknown): boolean {
  return isApiRequestError(error) && error.isValidationError;
}

/**
 * Check if an error is a server error.
 */
export function isServerError(error: unknown): boolean {
  return isApiRequestError(error) && error.isServerError;
}

/**
 * Check if an error is a network error.
 */
export function isNetworkError(error: unknown): boolean {
  return isApiRequestError(error) && error.isNetworkError;
}

// ============================================================================
// Error Message Utilities
// ============================================================================

/**
 * Get a user-friendly error message from any error type.
 */
export function getErrorMessage(error: unknown): string {
  if (isApiRequestError(error)) {
    return error.getUserMessage();
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Get detailed error info for debugging (shown in dev mode).
 */
export function getErrorDetails(
  error: unknown
): Record<string, unknown> | null {
  if (isApiRequestError(error)) {
    return {
      type: error.errorType,
      statusCode: error.statusCode,
      message: error.message,
      path: error.path,
      timestamp: error.timestamp,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return null;
}
