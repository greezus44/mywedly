import React, { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage } from "../../lib/upload";

export interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  eventId: string;
  className?: string;
  label?: string;
  aspect?: string; // e.g. "16/9", "1/1", "4/3"
}

export function ImageUpload({
  value,
  onChange,
  eventId,
  className,
  label,
  aspect = "16/9",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      setUploading(true);
      setError(null);
      try {
        const url = await uploadImage(file, eventId, "cover");
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [eventId, onChange],
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      try {
        await removeImage(value);
      } catch {
        // ignore removal errors
      }
    }
    onChange(null);
  }, [value, onChange]);

  return (
    <div className={cn("w-full", className)}>
      {label && <span className="block text-sm font-medium text-dash-text mb-1">{label}</span>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-colors",
          dragging ? "border-dash-primary bg-dash-primary/5" : "border-dash-border bg-dash-surface hover:border-dash-primary/50",
        )}
        style={{ aspectRatio: aspect }}
      >
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
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-dash-muted">
            <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Uploading…</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt="Upload preview" className="absolute inset-0 h-full w-full rounded-xl object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
            >
              Remove
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 px-4 py-8 text-center">
            <span className="text-2xl">📷</span>
            <span className="text-sm text-dash-muted">Drag & drop or click to upload</span>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
    </div>
  );
}
