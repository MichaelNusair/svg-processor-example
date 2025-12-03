import React, { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { RectangleItem, Design } from '@svg-processor/shared-types';
import { useDesign, useCanvasRenderer } from '../hooks';
import { LoadingPage, ErrorAlert, StatusBadge, IssueList } from '../components';
import { formatDate, formatPercentage } from '../utils/format';

interface TooltipData {
  x: number;
  y: number;
  rect: RectangleItem;
  index: number;
}

export function DesignDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { design, isLoading, error, refetch } = useDesign(id);
  const [selectedRect, setSelectedRect] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Type assertion: design is guaranteed to be non-null at this point
  const designData = design as Design | null;

  const canvasConfig = designData
    ? {
        svgWidth: designData.svgWidth ?? 0,
        svgHeight: designData.svgHeight ?? 0,
        items: designData.items,
        selectedIndex: selectedRect,
      }
    : null;

  const { canvasRef, findRectAtPosition, width, height } =
    useCanvasRenderer(canvasConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!designData || !canvasRef.current || !containerRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const index = findRectAtPosition(
        e.clientX - rect.left,
        e.clientY - rect.top
      );

      if (index !== null && designData.items[index]) {
        const cr = containerRef.current.getBoundingClientRect();
        const rectItem = designData.items[index];
        setTooltip({
          x: e.clientX - cr.left + 10,
          y: e.clientY - cr.top + 10,
          rect: rectItem,
          index,
        });
      } else {
        setTooltip(null);
      }
    },
    [designData, canvasRef, findRectAtPosition]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const index = findRectAtPosition(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      setSelectedRect(index === selectedRect ? null : index);
    },
    [canvasRef, findRectAtPosition, selectedRect]
  );

  if (isLoading) return <LoadingPage />;
  if (error || !design) {
    return (
      <div>
        <button
          className="back-btn"
          onClick={(): void => {
            navigate('/designs');
          }}
        >
          ← Back to Designs
        </button>
        <ErrorAlert
          error={error ?? 'Design not found'}
          onRetry={(): void => {
            void refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <button
        className="back-btn"
        onClick={(): void => {
          navigate('/designs');
        }}
      >
        ← Back to Designs
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ flex: 1 }}>{designData.originalFilename}</h1>
        <StatusBadge status={designData.status} />
      </div>

      <div className="page-grid two-col">
        <div>
          <h2 style={{ marginBottom: '1rem' }}>Canvas Preview</h2>
          <div className="canvas-container" ref={containerRef}>
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              onMouseMove={handleMouseMove}
              onMouseLeave={(): void => {
                setTooltip(null);
              }}
              onClick={handleClick}
              style={{
                cursor: designData.items.length > 0 ? 'pointer' : 'default',
              }}
            />
            {tooltip && (
              <div
                className="tooltip"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                <div className="tooltip-row">
                  <span className="tooltip-label">Rectangle</span>
                  <span className="tooltip-value">#{tooltip.index + 1}</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Position</span>
                  <span className="tooltip-value">
                    ({tooltip.rect.x}, {tooltip.rect.y})
                  </span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Size</span>
                  <span className="tooltip-value">
                    {tooltip.rect.width} × {tooltip.rect.height}
                  </span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Fill</span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div
                      className="tooltip-color"
                      style={{ backgroundColor: tooltip.rect.fill }}
                    />
                    <span className="tooltip-value">{tooltip.rect.fill}</span>
                  </div>
                </div>
                {tooltip.rect.isOutOfBounds && (
                  <div className="tooltip-row">
                    <span className="issue-badge out-of-bounds">
                      OUT OF BOUNDS
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 style={{ marginBottom: '1rem' }}>Design Details</h2>
          <div className="metadata-grid">
            <div className="metadata-item">
              <div className="metadata-label">SVG Dimensions</div>
              <div className="metadata-value">
                {designData.svgWidth} × {designData.svgHeight}
              </div>
            </div>
            <div className="metadata-item">
              <div className="metadata-label">Rectangle Count</div>
              <div className="metadata-value">{designData.itemsCount}</div>
            </div>
            <div className="metadata-item">
              <div className="metadata-label">Coverage Ratio</div>
              <div className="metadata-value">
                {formatPercentage(designData.coverageRatio)}
              </div>
            </div>
            <div className="metadata-item">
              <div className="metadata-label">Created</div>
              <div className="metadata-value" style={{ fontSize: '0.9rem' }}>
                {formatDate(designData.createdAt)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <h3
              style={{
                fontSize: '1rem',
                marginBottom: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              Issues
            </h3>
            {designData.issues.length > 0 ? (
              <IssueList issues={designData.issues} />
            ) : (
              <span style={{ color: 'var(--accent-success)' }}>
                ✓ No issues detected
              </span>
            )}
          </div>

          {selectedRect !== null &&
            selectedRect < designData.items.length &&
            designData.items[selectedRect] && (
              <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                  Selected: Rectangle #{selectedRect + 1}
                </h3>
                <div
                  className="metadata-grid"
                  style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
                >
                  <div className="metadata-item">
                    <div className="metadata-label">X</div>
                    <div className="metadata-value">
                      {designData.items[selectedRect].x}
                    </div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">Y</div>
                    <div className="metadata-value">
                      {designData.items[selectedRect].y}
                    </div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">Width</div>
                    <div className="metadata-value">
                      {designData.items[selectedRect].width}
                    </div>
                  </div>
                  <div className="metadata-item">
                    <div className="metadata-label">Height</div>
                    <div className="metadata-value">
                      {designData.items[selectedRect].height}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    marginTop: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      backgroundColor: designData.items[selectedRect].fill,
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                    }}
                  />
                  <div>
                    <div className="metadata-label">Fill</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>
                      {designData.items[selectedRect].fill}
                    </div>
                  </div>
                </div>
                {designData.items[selectedRect].isOutOfBounds && (
                  <div
                    className="alert alert-error"
                    style={{ marginTop: '1rem' }}
                  >
                    ⚠️ Out of bounds
                  </div>
                )}
              </div>
            )}

          {designData.items.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3
                style={{
                  fontSize: '1rem',
                  marginBottom: '0.75rem',
                  color: 'var(--text-secondary)',
                }}
              >
                All Rectangles
              </h3>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                {designData.items.map((rect, i) => (
                  <div
                    key={i}
                    className="card"
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      borderColor:
                        selectedRect === i
                          ? 'var(--accent-primary)'
                          : undefined,
                    }}
                    onClick={(): void => {
                      setSelectedRect(selectedRect === i ? null : i);
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          backgroundColor: rect.fill,
                          borderRadius: 4,
                          border: '1px solid var(--border-default)',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.875rem',
                        }}
                      >
                        #{i + 1}
                      </span>
                      <span
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.875rem',
                        }}
                      >
                        ({rect.x}, {rect.y}) • {rect.width}×{rect.height}
                      </span>
                      {rect.isOutOfBounds && (
                        <span
                          className="issue-badge out-of-bounds"
                          style={{ marginLeft: 'auto' }}
                        >
                          OOB
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
