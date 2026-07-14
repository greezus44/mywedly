import React, { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

interface ImageUploadProps {
  value?: string | null;
  onUpload: (file: File) => void;
  onRemove?: () => void;
  label?: string;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  value,
  onUpload,
  onRemove,
  label = "Upload image",
  className,
  accept = "image/*",
  maxSizeMB = 10,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large. Max ${maxSizeMB}MB.`);
        return;
      }
      onUpload(file);
    },
    [onUpload, maxSizeMB]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          "min-h-[160px] p-4",
          dragging
            ? "border-dash-primary bg-dash-bg"
            : "border-dash-border hover:border-dash-primary hover:bg-dash-bg"
        )}
      >
        {value ? (
          <div className="relative w-full">
            <img
              src={value}
              alt="Preview"
              className="max-h-48 mx-auto rounded-md object-contain"
            />
            {onRemove && (
              <Button
                variant="danger"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                Remove
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <svg className="mx-auto h-10 w-10 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="mt-2 text-sm text-dash-text">
              <span className="font-semibold text-dash-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-dash-muted">PNG, JPG, SVG up to {maxSizeMB}MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
    </div>
  );
}
