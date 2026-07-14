import React, { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";

export interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  eventId: string;
  className?: string;
  label?: string;
  aspect?: "square" | "video" | "banner" | "auto";
}

const aspectClasses: Record<string, string> = {
  square: "aspect-square",
  video: "aspect-video",
  banner: "aspect-[3/1]",
  auto: "aspect-auto",
};

export function ImageUpload({
  value,
  onChange,
  eventId,
  className,
  label,
  aspect = "video",
}: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        // Remove existing image if there is one
        if (value) {
          const existingPath = extractPathFromUrl(value);
          if (existingPath) {
            removeImage(value).catch(() => {});
          }
        }
        const url = await uploadImage(file, eventId);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setLoading(false);
      }
    },
    [value, eventId, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      const path = extractPathFromUrl(value);
      if (path) {
        try {
          await removeImage(value);
        } catch {
          // ignore removal errors
        }
      }
    }
    onChange(null);
  }, [value, onChange]);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-dash-text mb-1.5">
          {label}
        </label>
      )}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          aspectClasses[aspect],
          dragging
            ? "border-dash-primary bg-dash-primary/5"
            : "border-dash-border bg-dash-bg/50",
          error && "border-dash-danger"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Uploaded"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-dash-text hover:bg-white"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-lg bg-red-500/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
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
              <svg
                className="h-6 w-6 animate-spin text-dash-primary"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <>
                <svg
                  className="h-8 w-8"
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
                <span className="text-sm font-medium">
                  Drag & drop or click to upload
                </span>
                <span className="text-xs">PNG, JPG, GIF</span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <span className="block text-xs text-dash-danger mt-1">{error}</span>}
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
