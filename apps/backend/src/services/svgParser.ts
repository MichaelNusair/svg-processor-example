import { parseStringPromise } from "xml2js";
import type { RectangleItem, DesignIssue, ParsedSVGResult } from "@svg-processor/shared-types";
import { SVGParseError } from "../errors";
import { fileService } from "./file.service";

interface SVGAttributes {
  width?: string;
  height?: string;
  viewBox?: string;
}

interface RectAttributes {
  x?: string;
  y?: string;
  width?: string;
  height?: string;
  fill?: string;
  style?: string;
}

interface ParsedSVG {
  svg?: {
    $?: SVGAttributes;
    rect?: Array<{ $?: RectAttributes }> | { $?: RectAttributes };
  };
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function extractFill(attrs: RectAttributes): string {
  if (attrs.fill) return attrs.fill;
  const match = attrs.style?.match(/fill\s*:\s*([^;]+)/i);
  return match ? match[1].trim() : "#000000";
}

function parseDimensions(attrs: SVGAttributes): { width: number; height: number } {
  let width = parseNumber(attrs.width, 0);
  let height = parseNumber(attrs.height, 0);

  if ((width <= 0 || height <= 0) && attrs.viewBox) {
    const parts = attrs.viewBox.split(/[\s,]+/);
    if (parts.length === 4) {
      width = parseNumber(parts[2], width);
      height = parseNumber(parts[3], height);
    }
  }

  return { width, height };
}

class SVGParserService {
  async parseFile(filePath: string): Promise<ParsedSVGResult> {
    const content = await fileService.readFile(filePath);
    return this.parseContent(content);
  }

  async parseContent(svgContent: string): Promise<ParsedSVGResult> {
    const result: ParsedSVG = await parseStringPromise(svgContent, {
      explicitArray: false,
      mergeAttrs: false,
      trim: true,
    }).catch(() => {
      throw new SVGParseError("Invalid SVG: Failed to parse XML");
    });

    if (!result.svg) {
      throw new SVGParseError("Invalid SVG: No root svg element found");
    }

    const { width: svgWidth, height: svgHeight } = parseDimensions(result.svg.$ || {});

    if (svgWidth <= 0 || svgHeight <= 0) {
      throw new SVGParseError("Invalid SVG: width and height must be positive");
    }

    const items: RectangleItem[] = [];
    const issues: DesignIssue[] = [];
    let hasOutOfBounds = false;

    const rectElements = result.svg.rect;
    if (rectElements) {
      const rectArray = Array.isArray(rectElements) ? rectElements : [rectElements];

      for (const rect of rectArray) {
        const attrs = rect.$ || {};
        const x = parseNumber(attrs.x, 0);
        const y = parseNumber(attrs.y, 0);
        const width = parseNumber(attrs.width, 0);
        const height = parseNumber(attrs.height, 0);

        if (width <= 0 || height <= 0) continue;

        const isOutOfBounds = x + width > svgWidth || y + height > svgHeight;
        if (isOutOfBounds) hasOutOfBounds = true;

        items.push({ x, y, width, height, fill: extractFill(attrs), isOutOfBounds });
      }
    }

    if (items.length === 0) issues.push("EMPTY");
    if (hasOutOfBounds) issues.push("OUT_OF_BOUNDS");

    const svgArea = svgWidth * svgHeight;
    const totalRectArea = items.reduce((sum, item) => sum + item.width * item.height, 0);
    const coverageRatio = Math.round((totalRectArea / svgArea) * 10000) / 10000;

    return { svgWidth, svgHeight, items, itemsCount: items.length, coverageRatio, issues };
  }
}

export const svgParserService = new SVGParserService();
