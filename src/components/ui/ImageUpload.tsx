import { useCallback, useRef, useState, type DragEvent } from "react";
import { uploadImage } from "../../lib/upload";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

interface ImageUploadProps {
  userId: string;
  value?: string;
  onChange: (url: string, path: string) => void;
  onRemove?: () => void;
  label?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "wide" | "cover";
}

const aspectClasses: Record<string, string> = {
  square: "aspect-square",
  video: "aspect-video",
  wide: "aspect-[21/9]",
  cover: "aspect-[3/2]",
};

export function ImageUpload({
  userId,
  value,
  onChange,
  onRemove,
  label = "Upload Image",
  className,
  aspectRatio = "cover",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      const result = await uploadImage(file, userId);
      setUploading(false);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onChange(result.url, result.path);
    },
    [userId, onChange]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleFile(file);
      } else {
        setError("Please drop an image file.");
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>
      )}
      {value ? (
        <div className={cn("relative overflow-hidden rounded-lg border border-dash-border", aspectClasses[aspectRatio])}>
          <img src={value} alt="Upload preview" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              Replace
            </Button>
            {onRemove && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={onRemove}
                disabled={uploading}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            aspectClasses[aspectRatio],
            isDragging
              ? "border-dash-primary bg-dash-primary/5"
              : "border-dash-border hover:border-dash-primary hover:bg-dash-bg"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-dash-muted">
              <svg className="h-8 w-8 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Uploading…</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-dash-muted">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm font-medium">Drag & drop or click to upload</span>
              <span className="text-xs">PNG, JPG, SVG up to 5MB</span>
            </div>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
      {error && <p className="mt-2 text-xs text-dash-danger">{error}</p>}
    </div>
  );
}
