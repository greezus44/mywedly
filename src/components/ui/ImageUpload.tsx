import React, { useState, useRef, useCallback } from "react";
import { cn } from "../../lib/utils";
import { uploadImage } from "../../lib/upload";

export interface ImageUploadProps {
  userId: string;
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  aspectRatio?: "square" | "wide" | "tall" | "auto";
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  userId,
  value,
  onChange,
  label,
  className,
  aspectRatio = "wide",
  accept = "image/*",
  maxSizeMB = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass = {
    square: "aspect-square",
    wide: "aspect-video",
    tall: "aspect-[3/4]",
    auto: "min-h-[120px]",
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Image must be under ${maxSizeMB}MB.`);
        return;
      }
      setUploading(true);
      try {
        const url = await uploadImage(file, userId);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [userId, onChange, maxSizeMB]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so selecting the same file again still fires
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("w-full", className)}>
      {label && <span className="mb-1.5 block text-sm font-medium text-dash-text">{label}</span>}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          dragOver ? "border-dash-primary bg-dash-primary/5" : "border-dash-border bg-dash-surface",
          aspectClass[aspectRatio]
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            <img src={value} alt="Uploaded" className="h-full w-full object-contain" />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <span className="text-sm text-dash-muted">Uploading…</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-dash-muted"
          >
            {uploading ? (
              <>
                <svg className="h-6 w-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Uploading…</span>
              </>
            ) : (
              <>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-sm">Drag & drop or click to upload</span>
              </>
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleSelect}
          className="hidden"
        />
      </div>
      {error && <p className="mt-1 text-sm text-dash-danger">{error}</p>}
    </div>
  );
}
