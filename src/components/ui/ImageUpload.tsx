import { useCallback, useRef, useState, type DragEvent } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";
import { LoadingSpinner } from "./index";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  path?: string;
  label?: string;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUpload({
  value,
  onChange,
  path = "uploads",
  label = "Upload Image",
  className,
  accept = "image/*",
  maxSizeMB = 10,
}: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large (max ${maxSizeMB}MB)`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        if (value) {
          const oldPath = extractPathFromUrl(value);
          if (oldPath) {
            await removeImage(oldPath).catch(() => {});
          }
        }
        const result = await uploadImage(file, path);
        onChange(result.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setLoading(false);
      }
    },
    [value, path, onChange, maxSizeMB]
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

  const handleRemove = useCallback(async () => {
    if (value) {
      const oldPath = extractPathFromUrl(value);
      if (oldPath) {
        await removeImage(oldPath).catch(() => {});
      }
    }
    onChange("");
  }, [value, onChange]);

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1">{label}</label>}
      {value ? (
        <div className="relative group rounded-lg border border-dash-border overflow-hidden">
          <img src={value} alt="Preview" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-dash-text hover:bg-white"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-md bg-red-500/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
            dragging ? "border-dash-primary bg-dash-primary/5" : "border-dash-border hover:border-dash-primary/50",
            loading && "pointer-events-none"
          )}
        >
          {loading ? (
            <LoadingSpinner />
          ) : (
            <>
              <svg className="h-10 w-10 text-dash-muted mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 16.5V18a2 2 0 002 2h14a2 2 0 002-2v-1.5M12 3v13M7 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-dash-muted">
                <span className="text-dash-primary font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-dash-muted mt-1">PNG, JPG, GIF up to {maxSizeMB}MB</p>
            </>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
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
