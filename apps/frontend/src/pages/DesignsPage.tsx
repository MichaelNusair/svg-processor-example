import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesignList } from '../hooks';
import {
  LoadingPage,
  ErrorAlert,
  Button,
  EmptyState,
  StatusBadge,
  IssueList,
} from '../components';
import { formatDate } from '../utils/format';

export function DesignsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { designs, isLoading, error, refetch } = useDesignList();

  if (isLoading) return <LoadingPage />;
  if (error)
    return (
      <ErrorAlert
        error={error as string | Error | null}
        onRetry={(): void => {
          void refetch();
        }}
      />
    );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1>Designs</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {designs.length} design{designs.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <Button
          onClick={(): void => {
            navigate('/');
          }}
        >
          Upload New
        </Button>
      </div>

      {designs.length === 0 ? (
        <EmptyState
          title="No designs yet"
          description="Upload your first SVG file to get started."
        />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Status</th>
                <th>Rectangles</th>
                <th>Issues</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {designs.map((design) => {
                // API response types are validated at runtime, safe to use here
                const designIdRaw = design._id;
                // Type conversion: design._id may be ObjectId or string, convert to string
                const designId =
                  typeof designIdRaw === 'string'
                    ? designIdRaw
                    : String(designIdRaw);
                const originalFilename = design.originalFilename;
                const status = design.status;
                const itemsCount = design.itemsCount;
                const issues = design.issues;
                const createdAt = design.createdAt;
                return (
                  <tr
                    key={designId}
                    className="clickable-row"
                    onClick={(): void => {
                      navigate(`/designs/${designId}`);
                    }}
                  >
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {originalFilename}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={status} />
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {itemsCount}
                      </span>
                    </td>
                    <td>
                      <IssueList issues={issues} />
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(createdAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
