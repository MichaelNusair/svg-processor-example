import React, { type ReactNode } from 'react';
import {
  getErrorMessage,
  getErrorDetails,
  isNotFoundError,
  isNetworkError,
  isServerError,
} from '../utils/errors';

interface AlertProps {
  variant: 'success' | 'error' | 'warning' | 'info';
  children: ReactNode;
}

export function Alert({ variant, children }: AlertProps): React.JSX.Element {
  return <div className={`alert alert-${variant}`}>{children}</div>;
}

interface ErrorAlertProps {
  error: unknown;
  onRetry?: () => void;
  showDetails?: boolean;
}

/**
 * Error alert component with intelligent error message handling.
 *
 * - Shows user-friendly messages based on error type
 * - Differentiates between 404, network, and server errors
 * - Shows detailed error info in development mode
 */
export function ErrorAlert({
  error,
  onRetry,
  showDetails = import.meta.env.DEV,
}: ErrorAlertProps): React.JSX.Element | null {
  if (!error) return null;

  const message = getErrorMessage(error);
  const details = showDetails ? getErrorDetails(error) : null;

  // Determine icon and additional context based on error type
  let icon = '⚠️';
  let contextMessage: string | null = null;

  if (isNotFoundError(error)) {
    icon = '🔍';
    contextMessage = 'The resource you requested could not be found.';
  } else if (isNetworkError(error)) {
    icon = '📡';
    contextMessage = 'Please check your internet connection.';
  } else if (isServerError(error)) {
    icon = '🔧';
    contextMessage = 'Our servers are having issues. Please try again later.';
  }

  // Determine if retry makes sense
  const canRetry = onRetry && !isNotFoundError(error);

  return (
    <div className="alert alert-error">
      <div
        style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}
      >
        <span style={{ fontSize: '1.25rem' }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500 }}>{message}</div>
          {contextMessage && contextMessage !== message && (
            <div
              style={{
                marginTop: '0.25rem',
                opacity: 0.85,
                fontSize: '0.875rem',
              }}
            >
              {contextMessage}
            </div>
          )}

          {/* Show error details in development */}
          {details && (
            <details
              style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}
            >
              <summary style={{ cursor: 'pointer' }}>Technical Details</summary>
              <pre
                style={{
                  marginTop: '0.25rem',
                  padding: '0.5rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '0.7rem',
                }}
              >
                {JSON.stringify(details, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {canRetry && (
          <button
            className="btn btn-secondary"
            style={{ flexShrink: 0 }}
            onClick={onRetry}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
