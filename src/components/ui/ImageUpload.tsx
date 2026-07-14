import { useCallback, useRef, useState, type DragEvent } from "react";
import { cn } from "../../lib/utils";
import { uploadImage } from "../../lib/upload";
import { Button } from "./Button";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  userId: string;
  label?: string;
  className?: string;
  aspectRatio?: string;
}

export function ImageUpload({
  value,
  onChange,
  userId,
  label = "Upload Image",
  className,
  aspectRatio = "16/9",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const url = await uploadImage(file, userId);
        onChange(url);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to upload image. Please try again.";
        setError(message);
      } finally {
        setUploading(false);
      }
    },
    [onChange, userId],
  );

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          dragging
            ? "border-dash-primary bg-dash-primary/5"
            : "border-dash-border bg-dash-surface",
        )}
        style={{ aspectRatio }}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Uploaded"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                Replace
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={handleRemove}
                disabled={uploading}
              >
                Remove
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-dash-muted hover:text-dash-text"
          >
            {uploading ? (
              <>
                <svg className="h-6 w-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">Uploading…</span>
              </>
            ) : (
              <>
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Click or drag to upload</span>
                <span className="text-xs">PNG, JPG, SVG</span>
              </>
            )}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-dash-danger">{error}</p>}
    </div>
  );
}

export default ImageUpload;
