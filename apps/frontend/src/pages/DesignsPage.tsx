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
  if (error) return <ErrorAlert error={error} onRetry={refetch} />;

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
              {designs.map((design) => (
                <tr
                  key={design._id}
                  className="clickable-row"
                  onClick={(): void => {
                    navigate(`/designs/${design._id}`);
                  }}
                >
                  <td>
                    <span style={{ fontWeight: 500 }}>
                      {design.originalFilename}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={design.status} />
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      {design.itemsCount}
                    </span>
                  </td>
                  <td>
                    <IssueList issues={design.issues} />
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(design.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
