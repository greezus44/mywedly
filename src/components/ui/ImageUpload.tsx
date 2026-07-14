import React, { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";
import { Button } from "./Button";

interface ImageUploadProps {
  value?: string | null;
  onChange?: (url: string | null, path: string | null) => void;
  bucket?: string;
  path?: string;
  className?: string;
  label?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  bucket = "event-assets",
  path = "uploads",
  className,
  label = "Upload Image",
  maxSizeMB = 10,
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large. Max ${maxSizeMB}MB.`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      setUploading(true);
      const result = await uploadImage(file, bucket, path);
      setUploading(false);
      if ("error" in result) {
        setError(result.error);
      } else {
        onChange?.(result.url, result.path);
      }
    },
    [bucket, path, maxSizeMB, onChange],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    if (!value) return;
    const storedPath = extractPathFromUrl(value, bucket);
    if (storedPath) {
      removeImage(bucket, storedPath);
    }
    onChange?.(null, null);
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-dash-text mb-1.5">
          {label}
        </label>
      )}
      {value ? (
        <div className="relative group rounded-lg border border-dash-border overflow-hidden">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
            >
              Replace
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || uploading}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center cursor-pointer rounded-lg border-2 border-dashed p-6 transition-colors",
            dragOver
              ? "border-dash-primary bg-sky-50"
              : "border-dash-border hover:border-dash-primary hover:bg-dash-bg",
            (disabled || uploading) && "opacity-50 cursor-not-allowed",
          )}
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-sm text-dash-muted">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Uploading...
            </div>
          ) : (
            <>
              <svg
                className="w-8 h-8 text-dash-muted mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-dash-text">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-dash-muted mt-1">
                PNG, JPG, SVG up to {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-1.5 text-xs text-dash-danger">{error}</p>}
    </div>
  );
}
