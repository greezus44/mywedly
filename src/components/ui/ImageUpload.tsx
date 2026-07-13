import { useCallback, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { compressImage, uploadImage, removeImage } from "../../lib/upload";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  eventId: string;
  className?: string;
  label?: string;
  aspect?: "square" | "wide" | "tall" | "auto";
}

const aspectClasses: Record<NonNullable<ImageUploadProps["aspect"]>, string> = {
  square: "aspect-square",
  wide: "aspect-video",
  tall: "aspect-[3/4]",
  auto: "min-h-[120px]",
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
        setError("Please select an image file");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        if (value) {
          await removeImage(value).catch(() => {});
        }
        const url = await uploadImage(file, eventId);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [value, eventId, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      await removeImage(value).catch(() => {});
    }
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [value, onChange]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <label className="text-sm font-medium text-dash-text">{label}</label>}
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          aspectClasses[aspect],
          dragging ? "border-dash-primary bg-dash-bg" : "border-dash-border bg-dash-surface",
          className
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            <img src={value} alt="Upload preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-dash-text hover:bg-dash-bg"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-dash-danger hover:bg-red-50"
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
            {uploading ? (
              <>
                <svg className="h-6 w-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Uploading…</span>
              </>
            ) : (
              <>
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-sm">Click or drag to upload</span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-dash-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
