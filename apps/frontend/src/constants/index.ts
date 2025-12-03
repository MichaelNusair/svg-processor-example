export const API_BASE = "/api/designs";

export const CANVAS = {
  WIDTH: 600,
  HEIGHT: 400,
  PADDING: 20,
  BG_COLOR: "#1a1f29",
  BOUNDARY_COLOR: "#30363d",
} as const;

export const STATUS_CLASSES: Record<string, string> = {
  pending: "status-pending",
  processing: "status-processing",
  completed: "status-completed",
  error: "status-error",
};
