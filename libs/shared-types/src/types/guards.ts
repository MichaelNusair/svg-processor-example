import type { DesignStatus, DesignIssue } from "./design";

export function isDesignStatus(value: unknown): value is DesignStatus {
  return (
    typeof value === "string" &&
    ["pending", "processing", "completed", "error"].includes(value)
  );
}

export function isDesignIssue(value: unknown): value is DesignIssue {
  return (
    typeof value === "string" && ["EMPTY", "OUT_OF_BOUNDS"].includes(value)
  );
}
