import type { RectangleItem } from "./rectangle";
import type { DesignIssue } from "./design";

export interface ParsedSVGResult {
  readonly svgWidth: number;
  readonly svgHeight: number;
  readonly items: readonly RectangleItem[];
  readonly itemsCount: number;
  readonly coverageRatio: number;
  readonly issues: readonly DesignIssue[];
}
