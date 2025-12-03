import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { RectangleItem } from "@svg-processor/shared-types";
import { useDesign, useCanvasRenderer } from "../hooks";
import { LoadingPage, ErrorAlert, StatusBadge, IssueList } from "../components";
import { formatDate, formatPercentage } from "../utils/format";

interface TooltipData {
  x: number;
  y: number;
  rect: RectangleItem;
  index: number;
}

export function DesignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { design, isLoading, error, refetch } = useDesign(id);
  const [selectedRect, setSelectedRect] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const canvasConfig = design
    ? { svgWidth: design.svgWidth || 0, svgHeight: design.svgHeight || 0, items: design.items, selectedIndex: selectedRect }
    : null;

  const { canvasRef, findRectAtPosition, width, height } = useCanvasRenderer(canvasConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!design || !canvasRef.current || !containerRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const index = findRectAtPosition(e.clientX - rect.left, e.clientY - rect.top);

    if (index !== null) {
      const cr = containerRef.current.getBoundingClientRect();
      setTooltip({ x: e.clientX - cr.left + 10, y: e.clientY - cr.top + 10, rect: design.items[index], index });
    } else {
      setTooltip(null);
    }
  }, [design, canvasRef, findRectAtPosition]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const index = findRectAtPosition(e.clientX - rect.left, e.clientY - rect.top);
    setSelectedRect(index === selectedRect ? null : index);
  }, [canvasRef, findRectAtPosition, selectedRect]);

  if (isLoading) return <LoadingPage />;
  if (error || !design) {
    return (
      <div>
        <button className="back-btn" onClick={() => navigate("/designs")}>← Back to Designs</button>
        <ErrorAlert error={error || "Design not found"} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div>
      <button className="back-btn" onClick={() => navigate("/designs")}>← Back to Designs</button>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <h1 style={{ flex: 1 }}>{design.originalFilename}</h1>
        <StatusBadge status={design.status} />
      </div>

      <div className="page-grid two-col">
        <div>
          <h2 style={{ marginBottom: "1rem" }}>Canvas Preview</h2>
          <div className="canvas-container" ref={containerRef}>
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setTooltip(null)}
              onClick={handleClick}
              style={{ cursor: design.items.length > 0 ? "pointer" : "default" }}
            />
            {tooltip && (
              <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
                <div className="tooltip-row">
                  <span className="tooltip-label">Rectangle</span>
                  <span className="tooltip-value">#{tooltip.index + 1}</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Position</span>
                  <span className="tooltip-value">({tooltip.rect.x}, {tooltip.rect.y})</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Size</span>
                  <span className="tooltip-value">{tooltip.rect.width} × {tooltip.rect.height}</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Fill</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div className="tooltip-color" style={{ backgroundColor: tooltip.rect.fill }} />
                    <span className="tooltip-value">{tooltip.rect.fill}</span>
                  </div>
                </div>
                {tooltip.rect.isOutOfBounds && (
                  <div className="tooltip-row">
                    <span className="issue-badge out-of-bounds">OUT OF BOUNDS</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 style={{ marginBottom: "1rem" }}>Design Details</h2>
          <div className="metadata-grid">
            <div className="metadata-item">
              <div className="metadata-label">SVG Dimensions</div>
              <div className="metadata-value">{design.svgWidth} × {design.svgHeight}</div>
            </div>
            <div className="metadata-item">
              <div className="metadata-label">Rectangle Count</div>
              <div className="metadata-value">{design.itemsCount}</div>
            </div>
            <div className="metadata-item">
              <div className="metadata-label">Coverage Ratio</div>
              <div className="metadata-value">{formatPercentage(design.coverageRatio)}</div>
            </div>
            <div className="metadata-item">
              <div className="metadata-label">Created</div>
              <div className="metadata-value" style={{ fontSize: "0.9rem" }}>{formatDate(design.createdAt)}</div>
            </div>
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--text-secondary)" }}>Issues</h3>
            {design.issues.length > 0 ? <IssueList issues={design.issues} /> : <span style={{ color: "var(--accent-success)" }}>✓ No issues detected</span>}
          </div>

          {selectedRect !== null && design.items[selectedRect] && (
            <div className="card" style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "1rem" }}>Selected: Rectangle #{selectedRect + 1}</h3>
              <div className="metadata-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                <div className="metadata-item"><div className="metadata-label">X</div><div className="metadata-value">{design.items[selectedRect].x}</div></div>
                <div className="metadata-item"><div className="metadata-label">Y</div><div className="metadata-value">{design.items[selectedRect].y}</div></div>
                <div className="metadata-item"><div className="metadata-label">Width</div><div className="metadata-value">{design.items[selectedRect].width}</div></div>
                <div className="metadata-item"><div className="metadata-label">Height</div><div className="metadata-value">{design.items[selectedRect].height}</div></div>
              </div>
              <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 32, height: 32, backgroundColor: design.items[selectedRect].fill, borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }} />
                <div>
                  <div className="metadata-label">Fill</div>
                  <div style={{ fontFamily: "var(--font-mono)" }}>{design.items[selectedRect].fill}</div>
                </div>
              </div>
              {design.items[selectedRect].isOutOfBounds && <div className="alert alert-error" style={{ marginTop: "1rem" }}>⚠️ Out of bounds</div>}
            </div>
          )}

          {design.items.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "var(--text-secondary)" }}>All Rectangles</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {design.items.map((rect, i) => (
                  <div
                    key={i}
                    className="card"
                    style={{ padding: "0.75rem 1rem", cursor: "pointer", borderColor: selectedRect === i ? "var(--accent-primary)" : undefined }}
                    onClick={() => setSelectedRect(selectedRect === i ? null : i)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: 20, height: 20, backgroundColor: rect.fill, borderRadius: 4, border: "1px solid var(--border-default)" }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>#{i + 1}</span>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                        ({rect.x}, {rect.y}) • {rect.width}×{rect.height}
                      </span>
                      {rect.isOutOfBounds && <span className="issue-badge out-of-bounds" style={{ marginLeft: "auto" }}>OOB</span>}
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
