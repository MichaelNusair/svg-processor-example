import type { DesignStatus } from "@svg-processor/shared-types";
import { STATUS_CLASSES } from "../constants";

export function StatusBadge({ status }: { status: DesignStatus }) {
  return (
    <span className={`status ${STATUS_CLASSES[status]}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}
