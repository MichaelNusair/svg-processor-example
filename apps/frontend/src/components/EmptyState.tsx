import type { ReactNode } from "react";

export function EmptyState({ title, description }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
      <h3 style={{ marginBottom: "0.5rem" }}>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
