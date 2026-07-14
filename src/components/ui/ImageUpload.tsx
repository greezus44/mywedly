import React, { useState, useRef, useCallback } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";
import { LoadingSpinner } from "./index";

export interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  eventId: string;
  className?: string;
  label?: string;
  aspect?: "square" | "16/9" | "4/3" | "3/2";
}

const aspectClass: Record<string, string> = {
  square: "aspect-square",
  "16/9": "aspect-video",
  "4/3": "aspect-[4/3]",
  "3/2": "aspect-[3/2]",
};

export function ImageUpload({
  value,
  onChange,
  eventId,
  className,
  label,
  aspect = "16/9",
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
      setLoading(true);
      setError(null);
      try {
        if (value) {
          await removeImage(value).catch(() => {});
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
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      await removeImage(value).catch(() => {});
    }
    onChange(null);
  }, [value, onChange]);

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="block text-sm font-medium text-dash-text mb-1">
          {label}
        </label>
      )}
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          aspectClass[aspect],
          dragging
            ? "border-dash-primary bg-dash-primary/5"
            : "border-dash-border bg-dash-bg",
          !value && "flex items-center justify-center"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Upload preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-dash-text hover:bg-white"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="rounded-md bg-red-500/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <svg
                  className="mb-2 h-8 w-8 text-dash-muted"
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
                <p className="text-sm text-dash-muted">
                  Drag & drop or click to upload
                </p>
              </>
            )}
          </div>
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
