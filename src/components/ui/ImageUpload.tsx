import React, { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";
import { LoadingSpinner } from "./index";

interface ImageUploadProps {
  value?: string | null;
  onUpload: (file: File) => Promise<string>;
  onRemove?: () => void;
  label?: string;
  className?: string;
  accept?: string;
  maxSizeMb?: number;
  aspectRatio?: string;
}

export function ImageUpload({
  value,
  onUpload,
  onRemove,
  label,
  className,
  accept = "image/*",
  maxSizeMb = 10,
  aspectRatio,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > maxSizeMb * 1024 * 1024) {
        setError(`File too large. Max ${maxSizeMb}MB.`);
        return;
      }
      setLoading(true);
      try {
        await onUpload(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setLoading(false);
      }
    },
    [onUpload, maxSizeMb]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      {value ? (
        <div className="relative group rounded-lg border border-dash-border overflow-hidden bg-dash-surface">
          <img
            src={value}
            alt="Uploaded preview"
            className="w-full object-cover"
            style={aspectRatio ? { aspectRatio } : { maxHeight: "300px" }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
            {onRemove && (
              <Button
                variant="danger"
                size="sm"
                onClick={onRemove}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors p-6 text-center",
            dragging
              ? "border-dash-primary bg-dash-primary/5"
              : "border-dash-border bg-dash-surface hover:border-dash-primary/50",
            aspectRatio ? "" : "min-h-[160px]"
          )}
          style={aspectRatio ? { aspectRatio } : undefined}
        >
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <svg
                className="h-8 w-8 text-dash-muted mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-sm text-dash-text font-medium">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-dash-muted mt-1">
                PNG, JPG, SVG up to {maxSizeMb}MB
              </p>
            </>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
