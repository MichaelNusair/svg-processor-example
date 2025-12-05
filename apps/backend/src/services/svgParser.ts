import { parseStringPromise } from 'xml2js';
import type {
  RectangleItem,
  DesignIssue,
  ParsedSVGResult,
} from '@svg-processor/shared-types';
import { SVGParseError } from '../errors';
import { fileService } from './file.service';
import { createLogger, metrics } from '../utils/logger';

const logger = createLogger('SVGParser');

// ============================================================================
// Configuration & Limits
// ============================================================================

/**
 * SVG Parser configuration for robustness and security.
 * These limits protect against malicious or malformed SVG files.
 */
const PARSER_CONFIG = {
  /**
   * Maximum file size in bytes (5MB).
   * Large SVG files can cause memory issues during parsing.
   */
  maxFileSizeBytes: 5 * 1024 * 1024,

  /**
   * Maximum number of rectangles to process.
   * Prevents DoS via SVGs with millions of elements.
   */
  maxRectangles: 10000,

  /**
   * Maximum SVG dimensions.
   * Prevents integer overflow in area calculations.
   */
  maxDimension: 100000,

  /**
   * Parsing timeout in milliseconds.
   * Prevents hanging on deeply nested or malicious SVGs.
   */
  parseTimeoutMs: 5000,
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

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
    rect?: { $?: RectAttributes }[] | { $?: RectAttributes };
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

function extractFill(attrs: RectAttributes): string {
  if (attrs.fill) return attrs.fill;
  const match = attrs.style?.match(/fill\s*:\s*([^;]+)/i);
  return match ? match[1].trim() : '#000000';
}

function parseDimensions(attrs: SVGAttributes): {
  width: number;
  height: number;
} {
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

/**
 * Creates a promise that rejects after a timeout.
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(
          new SVGParseError(
            `${operation} timed out after ${String(timeoutMs)}ms`
          )
        );
      }, timeoutMs);
    }),
  ]);
}

// ============================================================================
// SVG Parser Service
// ============================================================================

class SVGParserService {
  /**
   * Parse an SVG file from disk.
   * Includes file size validation.
   */
  async parseFile(filePath: string): Promise<ParsedSVGResult> {
    const startTime = performance.now();

    try {
      const content = await fileService.readFile(filePath);

      // Validate file size
      const fileSizeBytes = Buffer.byteLength(content, 'utf-8');
      if (fileSizeBytes > PARSER_CONFIG.maxFileSizeBytes) {
        throw new SVGParseError(
          `SVG file exceeds maximum size of ${String(PARSER_CONFIG.maxFileSizeBytes / 1024 / 1024)}MB`
        );
      }

      logger.debug('Parsing SVG file', {
        filePath,
        sizeBytes: fileSizeBytes,
      });

      const result = await this.parseContent(content);

      const duration = performance.now() - startTime;
      logger.debug('SVG parsed successfully', {
        filePath,
        durationMs: Math.round(duration),
        rectangles: result.itemsCount,
      });

      return result;
    } catch (error) {
      if (error instanceof SVGParseError) {
        throw error;
      }
      logger.error('SVG parsing failed', error as Error, { filePath });
      throw new SVGParseError(
        `Failed to read or parse SVG: ${(error as Error).message}`
      );
    }
  }

  /**
   * Parse SVG content string.
   * Includes timeout protection and validation.
   */
  async parseContent(svgContent: string): Promise<ParsedSVGResult> {
    // Validate content size
    const contentSize = Buffer.byteLength(svgContent, 'utf-8');
    if (contentSize > PARSER_CONFIG.maxFileSizeBytes) {
      throw new SVGParseError(
        `SVG content exceeds maximum size of ${String(PARSER_CONFIG.maxFileSizeBytes / 1024 / 1024)}MB`
      );
    }

    let result: ParsedSVG;
    try {
      // Parse XML with timeout protection
      const parsePromise = parseStringPromise(svgContent, {
        explicitArray: false,
        mergeAttrs: false,
        trim: true,
      });

      // xml2js returns untyped object, cast is necessary and safe for our schema
      const parsed: unknown = await withTimeout(
        parsePromise,
        PARSER_CONFIG.parseTimeoutMs,
        'XML parsing'
      );
      result = parsed as ParsedSVG;
    } catch (error) {
      if (error instanceof SVGParseError) {
        throw error;
      }
      throw new SVGParseError('Invalid SVG: Failed to parse XML');
    }

    if (!result.svg) {
      throw new SVGParseError('Invalid SVG: No root svg element found');
    }

    const { width: svgWidth, height: svgHeight } = parseDimensions(
      result.svg.$ ?? {}
    );

    // Validate dimensions
    if (svgWidth <= 0 || svgHeight <= 0) {
      throw new SVGParseError('Invalid SVG: width and height must be positive');
    }

    if (
      svgWidth > PARSER_CONFIG.maxDimension ||
      svgHeight > PARSER_CONFIG.maxDimension
    ) {
      throw new SVGParseError(
        `Invalid SVG: dimensions exceed maximum of ${String(PARSER_CONFIG.maxDimension)}px`
      );
    }

    const items: RectangleItem[] = [];
    const issues: DesignIssue[] = [];
    let hasOutOfBounds = false;

    const rectElements = result.svg.rect;
    if (rectElements) {
      const rectArray = Array.isArray(rectElements)
        ? rectElements
        : [rectElements];

      // Validate rectangle count
      if (rectArray.length > PARSER_CONFIG.maxRectangles) {
        logger.warn('SVG has too many rectangles, truncating', {
          total: rectArray.length,
          max: PARSER_CONFIG.maxRectangles,
        });
        metrics.increment('svg_rectangles_truncated_total');
      }

      // Process rectangles (up to limit)
      const rectsToProcess = rectArray.slice(0, PARSER_CONFIG.maxRectangles);

      for (const rect of rectsToProcess) {
        const attrs = rect.$ ?? {};
        const x = parseNumber(attrs.x, 0);
        const y = parseNumber(attrs.y, 0);
        const width = parseNumber(attrs.width, 0);
        const height = parseNumber(attrs.height, 0);

        if (width <= 0 || height <= 0) continue;

        const isOutOfBounds = x + width > svgWidth || y + height > svgHeight;
        if (isOutOfBounds) hasOutOfBounds = true;

        items.push({
          x,
          y,
          width,
          height,
          fill: extractFill(attrs),
          isOutOfBounds,
        });
      }
    }

    if (items.length === 0) issues.push('EMPTY');
    if (hasOutOfBounds) issues.push('OUT_OF_BOUNDS');

    // Calculate coverage ratio with overflow protection
    const svgArea = svgWidth * svgHeight;
    const totalRectArea = items.reduce(
      (sum, item) => sum + item.width * item.height,
      0
    );
    const coverageRatio = Math.round((totalRectArea / svgArea) * 10000) / 10000;

    // Record parsing metrics
    metrics.increment('svg_parsed_total', 1, {
      has_issues: issues.length > 0 ? 'true' : 'false',
    });

    return {
      svgWidth,
      svgHeight,
      items,
      itemsCount: items.length,
      coverageRatio,
      issues,
    };
  }
}

export const svgParserService = new SVGParserService();
