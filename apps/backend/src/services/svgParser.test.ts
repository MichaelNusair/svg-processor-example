import { describe, it, expect } from 'vitest';
import { svgParserService } from './svgParser';
import { SVGParseError } from '../errors';

// Test fixtures matching the assignment examples
const EXAMPLE_A_VALID = `<svg width="1200" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="80" width="300" height="120" fill="#FF0000" />
  <rect x="400" y="100" width="500" height="200" fill="#00FF00" />
  <rect x="950" y="50" width="200" height="300" fill="#0000FF" />
</svg>`;

const EXAMPLE_B_OUT_OF_BOUNDS = `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="50" width="200" height="200" fill="#FFAA00" />
  <rect x="700" y="100" width="200" height="250" fill="#FF0000" />
</svg>`;

const EXAMPLE_C_EMPTY = `<svg width="600" height="300" xmlns="http://www.w3.org/2000/svg"></svg>`;

describe('SVGParserService', () => {
  describe('parseContent', () => {
    describe('Example A - Valid SVG with 3 rectangles', () => {
      it('should parse dimensions correctly', async () => {
        const result = await svgParserService.parseContent(EXAMPLE_A_VALID);

        expect(result.svgWidth).toBe(1200);
        expect(result.svgHeight).toBe(400);
      });

      it('should extract all 3 rectangles', async () => {
        const result = await svgParserService.parseContent(EXAMPLE_A_VALID);

        expect(result.itemsCount).toBe(3);
        expect(result.items).toHaveLength(3);
      });

      it('should parse rectangle attributes correctly', async () => {
        const result = await svgParserService.parseContent(EXAMPLE_A_VALID);

        expect(result.items[0]).toEqual({
          x: 50,
          y: 80,
          width: 300,
          height: 120,
          fill: '#FF0000',
          isOutOfBounds: false,
        });

        expect(result.items[1]).toEqual({
          x: 400,
          y: 100,
          width: 500,
          height: 200,
          fill: '#00FF00',
          isOutOfBounds: false,
        });

        expect(result.items[2]).toEqual({
          x: 950,
          y: 50,
          width: 200,
          height: 300,
          fill: '#0000FF',
          isOutOfBounds: false,
        });
      });

      it('should detect no issues for valid SVG', async () => {
        const result = await svgParserService.parseContent(EXAMPLE_A_VALID);

        expect(result.issues).toEqual([]);
      });

      it('should calculate coverage ratio correctly', async () => {
        const result = await svgParserService.parseContent(EXAMPLE_A_VALID);

        // Total area: (300*120) + (500*200) + (200*300) = 36000 + 100000 + 60000 = 196000
        // Canvas area: 1200 * 400 = 480000
        // Coverage: 196000 / 480000 = 0.4083...
        expect(result.coverageRatio).toBeCloseTo(0.4083, 3);
      });
    });

    describe('Example B - Out of bounds rectangles', () => {
      it('should detect OUT_OF_BOUNDS issue', async () => {
        const result = await svgParserService.parseContent(
          EXAMPLE_B_OUT_OF_BOUNDS
        );

        expect(result.issues).toContain('OUT_OF_BOUNDS');
      });

      it('should mark the correct rectangle as out of bounds', async () => {
        const result = await svgParserService.parseContent(
          EXAMPLE_B_OUT_OF_BOUNDS
        );

        // First rect: x=50, width=200 -> 250 <= 800 (OK)
        expect(result.items[0].isOutOfBounds).toBe(false);

        // Second rect: x=700, width=200 -> 900 > 800 (OUT OF BOUNDS)
        // Also: y=100, height=250 -> 350 <= 400 (OK for height)
        expect(result.items[1].isOutOfBounds).toBe(true);
      });

      it('should still extract all rectangles even with issues', async () => {
        const result = await svgParserService.parseContent(
          EXAMPLE_B_OUT_OF_BOUNDS
        );

        expect(result.itemsCount).toBe(2);
      });
    });

    describe('Example C - Empty SVG', () => {
      it('should detect EMPTY issue', async () => {
        const result = await svgParserService.parseContent(EXAMPLE_C_EMPTY);

        expect(result.issues).toContain('EMPTY');
      });

      it('should have zero rectangles', async () => {
        const result = await svgParserService.parseContent(EXAMPLE_C_EMPTY);

        expect(result.itemsCount).toBe(0);
        expect(result.items).toEqual([]);
      });

      it('should still parse dimensions', async () => {
        const result = await svgParserService.parseContent(EXAMPLE_C_EMPTY);

        expect(result.svgWidth).toBe(600);
        expect(result.svgHeight).toBe(300);
      });

      it('should have zero coverage', async () => {
        const result = await svgParserService.parseContent(EXAMPLE_C_EMPTY);

        expect(result.coverageRatio).toBe(0);
      });
    });

    describe('Malformed SVG handling', () => {
      it('should throw SVGParseError for invalid XML', async () => {
        const invalidXML = '<svg><not closed properly';

        await expect(svgParserService.parseContent(invalidXML)).rejects.toThrow(
          SVGParseError
        );
      });

      it('should throw SVGParseError for non-SVG XML', async () => {
        const nonSvg = '<html><body>Not an SVG</body></html>';

        await expect(svgParserService.parseContent(nonSvg)).rejects.toThrow(
          'Invalid SVG: No root svg element found'
        );
      });

      it('should throw SVGParseError for SVG without dimensions', async () => {
        const noDimensions = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

        await expect(
          svgParserService.parseContent(noDimensions)
        ).rejects.toThrow('Invalid SVG: width and height must be positive');
      });

      it('should throw SVGParseError for negative dimensions', async () => {
        const negativeDims =
          '<svg width="-100" height="400" xmlns="http://www.w3.org/2000/svg"></svg>';

        await expect(
          svgParserService.parseContent(negativeDims)
        ).rejects.toThrow('Invalid SVG: width and height must be positive');
      });

      it('should throw SVGParseError for zero dimensions', async () => {
        const zeroDims =
          '<svg width="0" height="400" xmlns="http://www.w3.org/2000/svg"></svg>';

        await expect(svgParserService.parseContent(zeroDims)).rejects.toThrow(
          'Invalid SVG: width and height must be positive'
        );
      });
    });

    describe('Edge cases - Numeric strings with units', () => {
      it('should handle dimensions with px units', async () => {
        const withPx = `<svg width="800px" height="600px" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="100" height="100" fill="#000" />
        </svg>`;

        const result = await svgParserService.parseContent(withPx);

        // parseFloat handles "800px" -> 800
        expect(result.svgWidth).toBe(800);
        expect(result.svgHeight).toBe(600);
      });

      it('should handle rect attributes with px units', async () => {
        const withPx = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="10px" y="20px" width="100px" height="50px" fill="#000" />
        </svg>`;

        const result = await svgParserService.parseContent(withPx);

        expect(result.items[0]).toMatchObject({
          x: 10,
          y: 20,
          width: 100,
          height: 50,
        });
      });

      it('should use viewBox when width/height are missing', async () => {
        const withViewBox = `<svg viewBox="0 0 1000 500" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="100" height="100" fill="#000" />
        </svg>`;

        const result = await svgParserService.parseContent(withViewBox);

        expect(result.svgWidth).toBe(1000);
        expect(result.svgHeight).toBe(500);
      });

      it('should handle viewBox with comma separators', async () => {
        const withViewBox = `<svg viewBox="0,0,800,400" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="100" height="100" fill="#000" />
        </svg>`;

        const result = await svgParserService.parseContent(withViewBox);

        expect(result.svgWidth).toBe(800);
        expect(result.svgHeight).toBe(400);
      });
    });

    describe('Edge cases - Fill extraction', () => {
      it('should extract fill from style attribute', async () => {
        const withStyle = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="100" height="100" style="fill: #FF5500; stroke: black;" />
        </svg>`;

        const result = await svgParserService.parseContent(withStyle);

        expect(result.items[0].fill).toBe('#FF5500');
      });

      it('should default to black when no fill specified', async () => {
        const noFill = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="100" height="100" />
        </svg>`;

        const result = await svgParserService.parseContent(noFill);

        expect(result.items[0].fill).toBe('#000000');
      });

      it('should prefer fill attribute over style', async () => {
        const bothFills = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="100" height="100" fill="#FF0000" style="fill: #00FF00;" />
        </svg>`;

        const result = await svgParserService.parseContent(bothFills);

        expect(result.items[0].fill).toBe('#FF0000');
      });

      it('should handle named colors', async () => {
        const namedColor = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="100" height="100" fill="red" />
        </svg>`;

        const result = await svgParserService.parseContent(namedColor);

        expect(result.items[0].fill).toBe('red');
      });

      it('should handle rgb() color format', async () => {
        const rgbColor = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="100" height="100" fill="rgb(255, 128, 0)" />
        </svg>`;

        const result = await svgParserService.parseContent(rgbColor);

        expect(result.items[0].fill).toBe('rgb(255, 128, 0)');
      });
    });

    describe('Edge cases - Rectangle validation', () => {
      it('should skip rectangles with zero width', async () => {
        const zeroWidth = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="0" height="100" fill="#000" />
          <rect x="100" y="10" width="50" height="50" fill="#F00" />
        </svg>`;

        const result = await svgParserService.parseContent(zeroWidth);

        expect(result.itemsCount).toBe(1);
        expect(result.items[0].width).toBe(50);
      });

      it('should skip rectangles with zero height', async () => {
        const zeroHeight = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="100" height="0" fill="#000" />
        </svg>`;

        const result = await svgParserService.parseContent(zeroHeight);

        expect(result.itemsCount).toBe(0);
        expect(result.issues).toContain('EMPTY');
      });

      it('should skip rectangles with negative dimensions', async () => {
        const negativeDims = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="-100" height="100" fill="#000" />
        </svg>`;

        const result = await svgParserService.parseContent(negativeDims);

        expect(result.itemsCount).toBe(0);
      });

      it('should handle missing x/y attributes (default to 0)', async () => {
        const missingCoords = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="#000" />
        </svg>`;

        const result = await svgParserService.parseContent(missingCoords);

        expect(result.items[0].x).toBe(0);
        expect(result.items[0].y).toBe(0);
      });
    });

    describe('Edge cases - Single rectangle handling', () => {
      it('should handle SVG with single rectangle (non-array in xml2js)', async () => {
        const singleRect = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="100" height="100" fill="#000" />
        </svg>`;

        const result = await svgParserService.parseContent(singleRect);

        expect(result.itemsCount).toBe(1);
        expect(result.items).toHaveLength(1);
      });
    });

    describe('Edge cases - Out of bounds detection', () => {
      it('should detect rectangle exceeding width boundary', async () => {
        const exceedsWidth = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="750" y="10" width="100" height="100" fill="#000" />
        </svg>`;

        const result = await svgParserService.parseContent(exceedsWidth);

        // x(750) + width(100) = 850 > svgWidth(800)
        expect(result.items[0].isOutOfBounds).toBe(true);
        expect(result.issues).toContain('OUT_OF_BOUNDS');
      });

      it('should detect rectangle exceeding height boundary', async () => {
        const exceedsHeight = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="550" width="100" height="100" fill="#000" />
        </svg>`;

        const result = await svgParserService.parseContent(exceedsHeight);

        // y(550) + height(100) = 650 > svgHeight(600)
        expect(result.items[0].isOutOfBounds).toBe(true);
      });

      it('should NOT flag rectangle exactly at boundary', async () => {
        const atBoundary = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect x="700" y="500" width="100" height="100" fill="#000" />
        </svg>`;

        const result = await svgParserService.parseContent(atBoundary);

        // x(700) + width(100) = 800 === svgWidth(800)
        // y(500) + height(100) = 600 === svgHeight(600)
        expect(result.items[0].isOutOfBounds).toBe(false);
        expect(result.issues).not.toContain('OUT_OF_BOUNDS');
      });
    });

    describe('Coverage ratio edge cases', () => {
      it('should handle overlapping rectangles (count full area of each)', async () => {
        // Note: Current implementation doesn't account for overlaps
        const overlapping = `<svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="500" height="500" fill="#F00" />
          <rect x="250" y="250" width="500" height="500" fill="#00F" />
        </svg>`;

        const result = await svgParserService.parseContent(overlapping);

        // Area: 250000 + 250000 = 500000
        // Canvas: 1000000
        // Coverage: 0.5 (without overlap subtraction)
        expect(result.coverageRatio).toBe(0.5);
      });

      it('should handle coverage > 100% for large overlapping rectangles', async () => {
        const largeRects = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="100" height="100" fill="#F00" />
          <rect x="0" y="0" width="100" height="100" fill="#00F" />
        </svg>`;

        const result = await svgParserService.parseContent(largeRects);

        // Two 100x100 rects on 100x100 canvas = 200% coverage
        expect(result.coverageRatio).toBe(2);
      });
    });

    describe('Performance - Large SVG handling', () => {
      it('should handle SVG with many rectangles', async () => {
        // Generate SVG with 100 rectangles
        const rects = Array.from(
          { length: 100 },
          (_, i) =>
            `<rect x="${String(i * 10)}" y="${String(i * 5)}" width="8" height="4" fill="#${String(i).padStart(6, '0')}" />`
        ).join('\n');

        const largeSvg = `<svg width="2000" height="1000" xmlns="http://www.w3.org/2000/svg">
          ${rects}
        </svg>`;

        const result = await svgParserService.parseContent(largeSvg);

        expect(result.itemsCount).toBe(100);
      });
    });
  });
});
