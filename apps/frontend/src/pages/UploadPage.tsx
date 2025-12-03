import { useState, useRef, useCallback } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useUploadDesign } from "../hooks";
import { Button, Alert } from "../components";
import { formatFileSize } from "../utils/format";

export function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { upload, isUploading, error } = useUploadDesign();

  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".svg")) {
      setMessage({ type: "error", text: "Please select an SVG file" });
      return;
    }
    setFile(selectedFile);
    setMessage(null);
  }, []);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      const result = await upload(file);
      if (result) {
        setMessage({ type: "success", text: "Upload successful! Redirecting..." });
        setTimeout(() => navigate(`/designs/${result.id}`), 1000);
      }
    } catch {}
  };

  const displayMessage = message || (error ? { type: "error" as const, text: error.message } : null);

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "2rem" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>Upload SVG</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
        Upload an SVG file to process and analyze its rectangle elements.
      </p>

      {displayMessage && <Alert variant={displayMessage.type}>{displayMessage.text}</Alert>}

      <div
        className={`file-input-wrapper ${isDragOver ? "drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".svg"
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files?.[0] || null)}
        />
        <svg className="file-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <div className="file-input-text">
          <strong>Click to upload</strong> or drag and drop
          <br />
          <span style={{ fontSize: "0.875rem" }}>SVG files only</span>
        </div>
      </div>

      {file && (
        <div className="card" style={{ marginTop: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{file.name}</div>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{formatFileSize(file.size)}</div>
            </div>
            <Button variant="secondary" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
              Remove
            </Button>
          </div>
        </div>
      )}

      <Button
        style={{ marginTop: "1.5rem", width: "100%" }}
        disabled={!file}
        isLoading={isUploading}
        loadingText="Processing..."
        onClick={handleUpload}
      >
        Upload & Process
      </Button>
    </div>
  );
}
