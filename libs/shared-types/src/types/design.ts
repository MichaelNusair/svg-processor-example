import type { RectangleItem } from "./rectangle";

export type DesignIssue = "EMPTY" | "OUT_OF_BOUNDS";
export type DesignStatus = "pending" | "processing" | "completed" | "error";

export interface Design {
  readonly _id: string;
  readonly filename: string;
  readonly originalFilename: string;
  readonly filePath: string;
  readonly status: DesignStatus;
  readonly svgWidth?: number;
  readonly svgHeight?: number;
  readonly items: readonly RectangleItem[];
  readonly itemsCount: number;
  readonly coverageRatio: number;
  readonly issues: readonly DesignIssue[];
  readonly errorMessage?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DesignListItem {
  readonly _id: string;
  readonly filename: string;
  readonly originalFilename: string;
  readonly status: DesignStatus;
  readonly itemsCount: number;
  readonly coverageRatio: number;
  readonly issues: readonly DesignIssue[];
  readonly createdAt: string;
}
