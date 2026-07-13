import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";
import { cn } from "../../lib/utils";
import { compressImage, uploadImage } from "../../lib/upload";

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
  aspect = "aspect-video",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setError(null);
      setUploading(true);
      setProgress(0);

      // Simulate incremental progress while compression/upload runs
      let progressInterval: ReturnType<typeof setInterval> | undefined;
      progressInterval = setInterval(() => {
        setProgress((p) => (p < 90 ? p + 10 : p));
      }, 200);

      try {
        await compressImage(file);
        setProgress(90);
        const url = await uploadImage(file, eventId);
        setProgress(100);
        onChange(url);
      } catch (err) {
        console.error("Upload failed:", err);
        setError(err instanceof Error ? err.message : "Failed to upload image");
      } finally {
        if (progressInterval) clearInterval(progressInterval);
        setUploading(false);
        // Reset progress after a brief delay so the user sees 100%
        setTimeout(() => setProgress(0), 500);
      }
    },
    [eventId, onChange]
  );

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so selecting the same file again triggers change
    e.target.value = "";
  }

  function handleRemove() {
    onChange(null);
    setError(null);
  }

  function handleBrowse() {
    inputRef.current?.click();
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {value && !uploading ? (
        <div className={cn("relative overflow-hidden rounded-lg border border-dash-border bg-dash-surface", aspect)}>
          <img src={value} alt="Upload preview" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
            aria-label="Remove image"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBrowse}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-dash-surface transition-colors",
            aspect,
            isDragging
              ? "border-dash-primary bg-dash-primary/5"
              : "border-dash-border hover:border-dash-primary"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3 px-4">
              <svg
                className="h-8 w-8 animate-spin text-dash-primary"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <div className="w-full max-w-xs">
                <div className="mb-1 text-center text-xs text-dash-muted">
                  Uploading... {progress}%
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-dash-border">
                  <div
                    className="h-full rounded-full bg-dash-primary transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 text-center">
              <svg
                className="h-10 w-10 text-dash-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm font-medium text-dash-text">
                Drag and drop an image
              </p>
              <p className="text-xs text-dash-muted">
                or click to browse
              </p>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1.5 text-xs text-dash-danger">{error}</p>}
    </div>
  );
}
