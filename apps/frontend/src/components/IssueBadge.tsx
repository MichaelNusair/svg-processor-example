import React from 'react';
import type { DesignIssue } from '@svg-processor/shared-types';

const ISSUE_CONFIG: Record<DesignIssue, { className: string; label: string }> =
  {
    EMPTY: { className: 'empty', label: 'EMPTY' },
    OUT_OF_BOUNDS: { className: 'out-of-bounds', label: 'OUT OF BOUNDS' },
  };

export function IssueBadge({
  issue,
}: {
  issue: DesignIssue;
}): React.JSX.Element {
  const config = ISSUE_CONFIG[issue];
  return (
    <span className={`issue-badge ${config.className}`}>{config.label}</span>
  );
}

export function IssueList({
  issues,
}: {
  issues: readonly DesignIssue[];
}): React.JSX.Element {
  if (issues.length === 0) {
    return <span style={{ color: 'var(--text-muted)' }}>None</span>;
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {issues.map((issue) => (
        <IssueBadge key={issue} issue={issue} />
      ))}
    </div>
  );
}
