import { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";

interface ImageUploadProps {
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
  label = "Upload Image",
  aspect = "aspect-video",
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
        const url = await uploadImage(file, eventId);
        if (value) {
          await removeImage(value).catch(() => {});
        }
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [eventId, onChange, value]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      const path = extractPathFromUrl(value);
      if (path) {
        await removeImage(value).catch(() => {});
      }
    }
    onChange(null);
  }, [onChange, value]);

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          aspect,
          dragging ? "border-dash-primary bg-dash-primary/5" : "border-dash-border bg-dash-bg",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="rounded bg-white px-3 py-1.5 text-xs font-medium text-dash-text hover:bg-dash-bg"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            {uploading ? (
              <svg className="h-8 w-8 animate-spin text-dash-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <svg className="h-10 w-10 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-dash-muted">
                  <span className="font-medium text-dash-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-dash-muted">PNG, JPG, WebP up to 10MB</p>
              </>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
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
