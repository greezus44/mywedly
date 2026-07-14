import React, { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";

interface ImageUploadProps {
  bucket: string;
  path: string;
  value?: string | null;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  className?: string;
  aspectRatio?: "square" | "wide" | "tall" | "auto";
}

const aspectClasses: Record<NonNullable<ImageUploadProps["aspectRatio"]>, string> = {
  square: "aspect-square",
  wide: "aspect-[16/9]",
  tall: "aspect-[3/4]",
  auto: "min-h-[120px]",
};

export function ImageUpload({
  bucket,
  path,
  value,
  onUpload,
  onRemove,
  label,
  className,
  aspectRatio = "wide",
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
        const url = await uploadImage(file, bucket, path);
        onUpload(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [bucket, path, onUpload]
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      const filePath = extractPathFromUrl(value, bucket);
      if (filePath) {
        try {
          await removeImage(bucket, filePath);
        } catch {
          // ignore removal errors
        }
      }
    }
    onRemove?.();
  }, [value, bucket, onRemove]);

  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">
          {label}
        </label>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          dragging
            ? "border-dash-primary bg-dash-primary/5"
            : "border-dash-border bg-dash-bg",
          aspectClasses[aspectRatio]
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Uploaded"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                Replace
              </Button>
              {onRemove && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleRemove}
                  disabled={uploading}
                >
                  Remove
                </Button>
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center gap-1 p-4 text-dash-muted hover:text-dash-text"
          >
            {uploading ? (
              <span className="text-sm">Uploading…</span>
            ) : (
              <>
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm">Click or drag to upload</span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
