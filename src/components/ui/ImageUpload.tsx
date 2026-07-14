import React, { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";
import { LoadingSpinner } from "./index";

export interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  eventId: string;
  className?: string;
  label?: string;
  aspect?: string;
}

export function ImageUpload({
  value,
  onChange,
  eventId,
  className,
  label,
  aspect = "aspect-[16/9]",
}: ImageUploadProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const url = await uploadImage(file, eventId);
        if (value) {
          await removeImage(value).catch(() => {});
        }
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setLoading(false);
      }
    },
    [eventId, onChange, value],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      await removeImage(value).catch(() => {});
    }
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange, value]);

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          aspect,
          dragging ? "border-dash-primary bg-dash-primary/5" : "border-dash-border bg-dash-bg",
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Upload preview" className="h-full w-full object-cover" />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <LoadingSpinner className="text-white" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-dash-text hover:bg-dash-bg"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-md bg-dash-danger px-3 py-1.5 text-xs font-medium text-dash-danger-fg hover:bg-dash-danger-hover"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-dash-muted hover:text-dash-text"
          >
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium">Click or drag to upload</span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-dash-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
