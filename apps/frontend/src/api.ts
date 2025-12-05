import type {
  Design,
  DesignListItem,
  ApiError,
} from '@svg-processor/shared-types';
import { API_BASE } from './constants';
import { ApiRequestError } from './utils/errors';

// ============================================================================
// API Client with Typed Errors
// ============================================================================

/**
 * Check if a response body looks like our API error format.
 */
function isApiErrorResponse(data: unknown): data is ApiError {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    'message' in data &&
    'statusCode' in data
  );
}

/**
 * Generic fetch wrapper with typed error handling.
 *
 * - Parses API error responses into ApiRequestError
 * - Handles network errors
 * - Provides consistent error experience
 */
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch {
    // Network error (no connection, CORS, etc.)
    throw ApiRequestError.fromNetworkError();
  }

  if (!response.ok) {
    let errorData: unknown;

    try {
      errorData = await response.json();
    } catch {
      // Response is not JSON
      errorData = null;
    }

    // Parse structured error response
    if (isApiErrorResponse(errorData)) {
      throw ApiRequestError.fromApiError(errorData);
    }

    // Fallback for non-standard error responses
    const message =
      typeof errorData === 'object' &&
      errorData !== null &&
      'message' in errorData
        ? String((errorData as { message: unknown }).message)
        : `Request failed with status ${String(response.status)}`;

    throw new ApiRequestError(
      message,
      response.status,
      response.statusText || 'UnknownError',
      url
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * Upload an SVG file for processing.
 */
export async function uploadSVG(
  file: File
): Promise<{ id: string; message: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return fetchApi(API_BASE, { method: 'POST', body: formData });
}

/**
 * Get list of all designs.
 */
export async function getDesigns(): Promise<DesignListItem[]> {
  return fetchApi(API_BASE);
}

/**
 * Get a single design by ID.
 */
export async function getDesign(id: string): Promise<Design> {
  return fetchApi(`${API_BASE}/${id}`);
}

/**
 * Delete a design by ID.
 */
export async function deleteDesign(id: string): Promise<void> {
  return fetchApi(`${API_BASE}/${id}`, { method: 'DELETE' });
}

/**
 * Reprocess a failed design.
 */
export async function reprocessDesign(id: string): Promise<void> {
  return fetchApi(`${API_BASE}/${id}/reprocess`, { method: 'POST' });
}
