import React from 'react';
import type { DesignStatus } from '@svg-processor/shared-types';
import { STATUS_CLASSES } from '../constants';

export function StatusBadge({
  status,
}: {
  status: DesignStatus;
}): React.JSX.Element {
  return (
    <span className={`status ${STATUS_CLASSES[status]}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}
