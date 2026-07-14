import { useCallback, useRef, useState, type DragEvent } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";

interface ImageUploadProps {
  bucket: string;
  path: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
  accept?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function ImageUpload({
  bucket,
  path,
  value,
  onChange,
  label,
  className,
  accept = "image/*",
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.82,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      const result = await uploadImage(file, bucket, path, { maxWidth, maxHeight, quality });
      setUploading(false);
      if ("error" in result) {
        setError(result.error);
      } else {
        onChange(result.url);
      }
    },
    [bucket, path, onChange, maxWidth, maxHeight, quality],
  );

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    }
  }

  async function handleRemove() {
    if (value) {
      const storagePath = extractPathFromUrl(value);
      await removeImage(bucket, storagePath);
    }
    onChange(null);
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex min-h-[160px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors",
          dragOver ? "border-dash-primary bg-dash-primary/5" : "border-dash-border hover:border-dash-primary/50",
        )}
      >
        {value ? (
          <div className="relative h-full w-full">
            <img src={value} alt="Upload preview" className="h-full max-h-[240px] w-full rounded-lg object-contain" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
              aria-label="Remove image"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
            </button>
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-2 text-dash-muted">
            <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-dash-muted">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm font-medium">Drag and drop or click to upload</span>
            <span className="text-xs">PNG, JPG, SVG (max {maxWidth}px)</span>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-dash-danger">{error}</p>}
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
