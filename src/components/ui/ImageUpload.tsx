import React, { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";

export interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  eventId: string;
  className?: string;
  label?: string;
  aspect?: "square" | "wide" | "tall" | "auto";
}

const ASPECT_CLASS: Record<NonNullable<ImageUploadProps["aspect"]>, string> = {
  square: "aspect-square",
  wide: "aspect-video",
  tall: "aspect-[3/4]",
  auto: "aspect-auto min-h-[120px]",
};

export function ImageUpload({
  value,
  onChange,
  eventId,
  className,
  label,
  aspect = "wide",
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
      setError(null);
      setUploading(true);
      try {
        const url = await uploadImage(file, eventId);
        if (value) {
          const oldPath = extractPathFromUrl(value);
          if (oldPath) {
            try {
              await removeImage(value);
            } catch {
              /* ignore */
            }
          }
        }
        onChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [eventId, onChange, value]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onRemove = useCallback(async () => {
    if (value) {
      const path = extractPathFromUrl(value);
      if (path) {
        try {
          await removeImage(value);
        } catch {
          /* ignore */
        }
      }
    }
    onChange(null);
  }, [onChange, value]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-sm font-medium text-dash-text">{label}</span>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed bg-dash-bg transition-colors",
          dragging ? "border-dash-primary bg-dash-primary/5" : "border-dash-border hover:border-dash-primary/50",
          ASPECT_CLASS[aspect]
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Upload preview" className="h-full w-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center">
            {uploading ? (
              <svg className="animate-spin h-6 w-6 text-dash-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-dash-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            )}
            <p className="text-sm text-dash-muted">
              {uploading ? "Uploading…" : "Drag & drop or click to upload"}
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-dash-danger">{error}</p>}
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="self-start text-xs text-dash-danger hover:underline"
        >
          Remove image
        </button>
      )}
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
