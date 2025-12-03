import React, { useCallback, useEffect, useState, useRef } from 'react';
import type { RectangleItem } from '@svg-processor/shared-types';
import { CANVAS } from '../constants';

interface CanvasConfig {
  svgWidth: number;
  svgHeight: number;
  items: readonly RectangleItem[];
  selectedIndex: number | null;
}

export function useCanvasRenderer(config: CanvasConfig | null): {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  findRectAtPosition: (canvasX: number, canvasY: number) => number | null;
  width: number;
  height: number;
} {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    // Optional chaining is necessary: config can be null, and we need to check nested properties
    if (!config?.svgWidth || !config?.svgHeight) return;

    const availW = CANVAS.WIDTH - 2 * CANVAS.PADDING;
    const availH = CANVAS.HEIGHT - 2 * CANVAS.PADDING;
    const scale = Math.min(availW / config.svgWidth, availH / config.svgHeight);
    const scaledW = config.svgWidth * scale;
    const scaledH = config.svgHeight * scale;

    // Intentionally only depend on dimensions, not full config object to avoid unnecessary recalculations
    setViewport({
      scale,
      offsetX: CANVAS.PADDING + (availW - scaledW) / 2,
      offsetY: CANVAS.PADDING + (availH - scaledH) / 2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only recalculate when dimensions change
  }, [config?.svgWidth, config?.svgHeight]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !config) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { scale, offsetX, offsetY } = viewport;

    ctx.fillStyle = CANVAS.BG_COLOR;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    if (config.svgWidth && config.svgHeight) {
      ctx.strokeStyle = CANVAS.BOUNDARY_COLOR;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        offsetX,
        offsetY,
        config.svgWidth * scale,
        config.svgHeight * scale
      );
      ctx.setLineDash([]);
    }

    config.items.forEach((rect, i) => {
      const x = offsetX + rect.x * scale;
      const y = offsetY + rect.y * scale;
      const w = rect.width * scale;
      const h = rect.height * scale;

      ctx.fillStyle = rect.fill;
      ctx.fillRect(x, y, w, h);

      const isSelected = config.selectedIndex === i;
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
      } else if (rect.isOutOfBounds) {
        ctx.strokeStyle = '#f85149';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
      }

      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    });
  }, [config, viewport]);

  useEffect(() => {
    render();
  }, [render]);

  const findRectAtPosition = useCallback(
    (canvasX: number, canvasY: number): number | null => {
      if (!config) return null;
      const { scale, offsetX, offsetY } = viewport;

      for (let i = config.items.length - 1; i >= 0; i--) {
        const rect = config.items[i];
        const x = offsetX + rect.x * scale;
        const y = offsetY + rect.y * scale;
        if (
          canvasX >= x &&
          canvasX <= x + rect.width * scale &&
          canvasY >= y &&
          canvasY <= y + rect.height * scale
        ) {
          return i;
        }
      }
      return null;
    },
    [config, viewport]
  );

  return {
    canvasRef,
    findRectAtPosition,
    width: CANVAS.WIDTH,
    height: CANVAS.HEIGHT,
  };
}
