import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";

export interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  userId: string;
  label?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "wide" | "auto";
  placeholder?: string;
}

const aspectClasses: Record<string, string> = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[21/9]",
  auto: "",
};

export function ImageUpload({
  value,
  onChange,
  userId,
  label,
  className,
  aspectRatio = "video",
  placeholder = "Click or drag to upload an image",
}: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        // Remove previous image if it exists
        if (value) {
          const prevPath = extractPathFromUrl(value);
          if (prevPath) {
            removeImage(value).catch(() => {
              // ignore removal errors
            });
          }
        }
        const url = await uploadImage(file, userId);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image.");
      } finally {
        setLoading(false);
      }
    },
    [userId, value, onChange]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleRemove = () => {
    if (value) {
      const path = extractPathFromUrl(value);
      if (path) {
        removeImage(value).catch(() => {});
      }
    }
    onChange(null);
  };

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          aspectClasses[aspectRatio],
          dragging
            ? "border-dash-primary bg-dash-primary/5"
            : "border-dash-border hover:border-dash-primary/50",
          value && "border-solid"
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Uploaded"
              className="h-full w-full object-cover"
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            {loading ? (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-dash-primary border-t-transparent" />
                <p className="text-sm text-dash-muted">Uploading...</p>
              </>
            ) : (
              <>
                <svg className="h-8 w-8 text-dash-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-dash-muted">{placeholder}</p>
                <p className="text-xs text-dash-muted/60">PNG, JPG, SVG up to 10MB</p>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

export default ImageUpload;
