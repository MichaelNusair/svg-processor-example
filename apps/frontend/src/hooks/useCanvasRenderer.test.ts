import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasRenderer } from './useCanvasRenderer';
import type { RectangleItem } from '@svg-processor/shared-types';
import { CANVAS } from '../constants';

describe('useCanvasRenderer', () => {
  const mockItems: RectangleItem[] = [
    {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fill: '#FF0000',
      isOutOfBounds: false,
    },
    {
      x: 200,
      y: 100,
      width: 150,
      height: 80,
      fill: '#00FF00',
      isOutOfBounds: false,
    },
    {
      x: 400,
      y: 50,
      width: 200,
      height: 200,
      fill: '#0000FF',
      isOutOfBounds: true,
    },
  ];

  describe('initialization', () => {
    it('should return canvas dimensions from constants', () => {
      const { result } = renderHook(() =>
        useCanvasRenderer({
          svgWidth: 800,
          svgHeight: 600,
          items: mockItems,
          selectedIndex: null,
        })
      );

      expect(result.current.width).toBe(CANVAS.WIDTH);
      expect(result.current.height).toBe(CANVAS.HEIGHT);
    });

    it('should create canvas ref', () => {
      const { result } = renderHook(() =>
        useCanvasRenderer({
          svgWidth: 800,
          svgHeight: 600,
          items: mockItems,
          selectedIndex: null,
        })
      );

      expect(result.current.canvasRef).toBeDefined();
      expect(result.current.canvasRef.current).toBe(null);
    });

    it('should handle null config gracefully', () => {
      const { result } = renderHook(() => useCanvasRenderer(null));

      expect(result.current.width).toBe(CANVAS.WIDTH);
      expect(result.current.height).toBe(CANVAS.HEIGHT);
      expect(result.current.findRectAtPosition(0, 0)).toBe(null);
    });
  });

  describe('findRectAtPosition', () => {
    it('should find rectangle at given position', () => {
      const { result } = renderHook(() =>
        useCanvasRenderer({
          svgWidth: 800,
          svgHeight: 600,
          items: mockItems,
          selectedIndex: null,
        })
      );

      // Calculate expected scale and offset
      const availW = CANVAS.WIDTH - 2 * CANVAS.PADDING;
      const availH = CANVAS.HEIGHT - 2 * CANVAS.PADDING;
      const scale = Math.min(availW / 800, availH / 600);
      const scaledW = 800 * scale;
      const scaledH = 600 * scale;
      const offsetX = CANVAS.PADDING + (availW - scaledW) / 2;
      const offsetY = CANVAS.PADDING + (availH - scaledH) / 2;

      // Position inside first rectangle (0,0 to 100,100)
      const canvasX = offsetX + 50 * scale;
      const canvasY = offsetY + 50 * scale;

      const index = result.current.findRectAtPosition(canvasX, canvasY);
      expect(index).toBe(0);
    });

    it('should return null for position outside all rectangles', () => {
      const { result } = renderHook(() =>
        useCanvasRenderer({
          svgWidth: 800,
          svgHeight: 600,
          items: mockItems,
          selectedIndex: null,
        })
      );

      // Position far outside any rectangle
      const index = result.current.findRectAtPosition(0, 0);
      expect(index).toBe(null);
    });

    it('should return topmost (last) rectangle when overlapping', () => {
      const overlappingItems: RectangleItem[] = [
        {
          x: 0,
          y: 0,
          width: 200,
          height: 200,
          fill: '#FF0000',
          isOutOfBounds: false,
        },
        {
          x: 50,
          y: 50,
          width: 200,
          height: 200,
          fill: '#00FF00',
          isOutOfBounds: false,
        },
      ];

      const { result } = renderHook(() =>
        useCanvasRenderer({
          svgWidth: 400,
          svgHeight: 400,
          items: overlappingItems,
          selectedIndex: null,
        })
      );

      // Calculate position in overlap area
      const availW = CANVAS.WIDTH - 2 * CANVAS.PADDING;
      const availH = CANVAS.HEIGHT - 2 * CANVAS.PADDING;
      const scale = Math.min(availW / 400, availH / 400);
      const offsetX = CANVAS.PADDING + (availW - 400 * scale) / 2;
      const offsetY = CANVAS.PADDING + (availH - 400 * scale) / 2;

      // Position at (100, 100) in SVG coordinates - overlap area
      const canvasX = offsetX + 100 * scale;
      const canvasY = offsetY + 100 * scale;

      const index = result.current.findRectAtPosition(canvasX, canvasY);
      // Should return last (topmost) rectangle
      expect(index).toBe(1);
    });

    it('should handle empty items array', () => {
      const { result } = renderHook(() =>
        useCanvasRenderer({
          svgWidth: 800,
          svgHeight: 600,
          items: [],
          selectedIndex: null,
        })
      );

      const index = result.current.findRectAtPosition(100, 100);
      expect(index).toBe(null);
    });

    it('should return null for null config', () => {
      const { result } = renderHook(() => useCanvasRenderer(null));

      const index = result.current.findRectAtPosition(100, 100);
      expect(index).toBe(null);
    });
  });

  describe('scale and offset calculation', () => {
    it('should calculate correct scale for wide SVG', () => {
      const wideItems: RectangleItem[] = [
        {
          x: 0,
          y: 0,
          width: 1000,
          height: 100,
          fill: '#FF0000',
          isOutOfBounds: false,
        },
      ];

      const { result } = renderHook(() =>
        useCanvasRenderer({
          svgWidth: 1200,
          svgHeight: 300,
          items: wideItems,
          selectedIndex: null,
        })
      );

      // Wide SVG should be width-constrained
      const availW = CANVAS.WIDTH - 2 * CANVAS.PADDING;
      const availH = CANVAS.HEIGHT - 2 * CANVAS.PADDING;
      const expectedScale = Math.min(availW / 1200, availH / 300);

      // Test by finding a rectangle at a known position
      const offsetX = CANVAS.PADDING + (availW - 1200 * expectedScale) / 2;
      const offsetY = CANVAS.PADDING + (availH - 300 * expectedScale) / 2;

      const canvasX = offsetX + 500 * expectedScale;
      const canvasY = offsetY + 50 * expectedScale;

      const index = result.current.findRectAtPosition(canvasX, canvasY);
      expect(index).toBe(0);
    });

    it('should calculate correct scale for tall SVG', () => {
      const tallItems: RectangleItem[] = [
        {
          x: 0,
          y: 0,
          width: 100,
          height: 1000,
          fill: '#FF0000',
          isOutOfBounds: false,
        },
      ];

      const { result } = renderHook(() =>
        useCanvasRenderer({
          svgWidth: 200,
          svgHeight: 1000,
          items: tallItems,
          selectedIndex: null,
        })
      );

      // Tall SVG should be height-constrained
      const availW = CANVAS.WIDTH - 2 * CANVAS.PADDING;
      const availH = CANVAS.HEIGHT - 2 * CANVAS.PADDING;
      const expectedScale = Math.min(availW / 200, availH / 1000);

      const offsetX = CANVAS.PADDING + (availW - 200 * expectedScale) / 2;
      const offsetY = CANVAS.PADDING + (availH - 1000 * expectedScale) / 2;

      const canvasX = offsetX + 50 * expectedScale;
      const canvasY = offsetY + 500 * expectedScale;

      const index = result.current.findRectAtPosition(canvasX, canvasY);
      expect(index).toBe(0);
    });
  });

  describe('selectedIndex handling', () => {
    it('should accept selectedIndex without affecting findRectAtPosition', () => {
      const { result } = renderHook(() =>
        useCanvasRenderer({
          svgWidth: 800,
          svgHeight: 600,
          items: mockItems,
          selectedIndex: 0,
        })
      );

      // Calculate position for second rectangle
      const availW = CANVAS.WIDTH - 2 * CANVAS.PADDING;
      const availH = CANVAS.HEIGHT - 2 * CANVAS.PADDING;
      const scale = Math.min(availW / 800, availH / 600);
      const offsetX = CANVAS.PADDING + (availW - 800 * scale) / 2;
      const offsetY = CANVAS.PADDING + (availH - 600 * scale) / 2;

      // Click in second rectangle area
      const canvasX = offsetX + 250 * scale;
      const canvasY = offsetY + 150 * scale;

      const index = result.current.findRectAtPosition(canvasX, canvasY);
      expect(index).toBe(1);
    });

    it('should update when selectedIndex changes', () => {
      const { result, rerender } = renderHook(
        ({ selectedIndex }) =>
          useCanvasRenderer({
            svgWidth: 800,
            svgHeight: 600,
            items: mockItems,
            selectedIndex,
          }),
        { initialProps: { selectedIndex: null as number | null } }
      );

      // Initial state
      expect(result.current.canvasRef).toBeDefined();

      // Update selectedIndex
      rerender({ selectedIndex: 1 });

      // Hook should re-render without issues
      expect(result.current.canvasRef).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle zero-dimension config', () => {
      const { result } = renderHook(() =>
        useCanvasRenderer({
          svgWidth: 0,
          svgHeight: 0,
          items: [],
          selectedIndex: null,
        })
      );

      // Should not crash, findRectAtPosition should return null
      expect(result.current.findRectAtPosition(100, 100)).toBe(null);
    });

    it('should handle single rectangle', () => {
      const singleItem: RectangleItem[] = [
        {
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          fill: '#FF0000',
          isOutOfBounds: false,
        },
      ];

      const { result } = renderHook(() =>
        useCanvasRenderer({
          svgWidth: 200,
          svgHeight: 200,
          items: singleItem,
          selectedIndex: null,
        })
      );

      const availW = CANVAS.WIDTH - 2 * CANVAS.PADDING;
      const availH = CANVAS.HEIGHT - 2 * CANVAS.PADDING;
      const scale = Math.min(availW / 200, availH / 200);
      const offsetX = CANVAS.PADDING + (availW - 200 * scale) / 2;
      const offsetY = CANVAS.PADDING + (availH - 200 * scale) / 2;

      // Center of rectangle
      const canvasX = offsetX + 100 * scale;
      const canvasY = offsetY + 100 * scale;

      expect(result.current.findRectAtPosition(canvasX, canvasY)).toBe(0);
    });

    it('should handle config changes', () => {
      const { result, rerender } = renderHook(
        ({ svgWidth }) =>
          useCanvasRenderer({
            svgWidth,
            svgHeight: 600,
            items: mockItems,
            selectedIndex: null,
          }),
        { initialProps: { svgWidth: 800 } }
      );

      // Initial state
      expect(result.current.findRectAtPosition).toBeDefined();

      // Change dimensions
      rerender({ svgWidth: 1000 });

      // Should recalculate scale
      expect(result.current.findRectAtPosition).toBeDefined();
    });
  });
});
