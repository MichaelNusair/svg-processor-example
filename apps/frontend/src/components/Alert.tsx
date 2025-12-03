import React, { type ReactNode } from 'react';

interface AlertProps {
  variant: 'success' | 'error';
  children: ReactNode;
}

export function Alert({ variant, children }: AlertProps): React.JSX.Element {
  return <div className={`alert alert-${variant}`}>{children}</div>;
}

export function ErrorAlert({
  error,
  onRetry,
}: {
  error: Error | string | null;
  onRetry?: () => void;
}): React.JSX.Element | null {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;

  return (
    <div className="alert alert-error">
      {message}
      {onRetry && (
        <button
          className="btn btn-secondary"
          style={{ marginLeft: '1rem' }}
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  );
}
