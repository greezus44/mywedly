import React, { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  onUpload?: (file: File) => Promise<string | null>;
  label?: string;
  className?: string;
  accept?: string;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  label = "Upload Image",
  className,
  accept = "image/*",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        if (onUpload) {
          const url = await onUpload(file);
          if (url) {
            onChange(url);
          } else {
            setError("Upload failed. Please try again.");
          }
        } else {
          // If no onUpload handler, use object URL as preview
          const url = URL.createObjectURL(file);
          onChange(url);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onChange, onUpload],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      {value ? (
        <div className="relative rounded-lg border border-dash-border bg-dash-surface p-2">
          <img src={value} alt="Preview" className="h-40 w-full rounded-md object-cover" />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={handleRemove}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            dragging ? "border-dash-primary bg-dash-primary/5" : "border-dash-border bg-dash-surface hover:border-dash-primary/50",
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="h-6 w-6 animate-spin text-dash-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm text-dash-muted">Uploading…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-center">
              <svg className="h-8 w-8 text-dash-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v9" />
              </svg>
              <span className="text-sm font-medium text-dash-text">Click or drag to upload</span>
              <span className="text-xs text-dash-muted">PNG, JPG, SVG up to 5MB</span>
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} onChange={handleInputChange} className="hidden" />
    </div>
  );
}
