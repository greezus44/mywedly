import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { cn } from "../../lib/utils";
import { compressImage, uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";

export interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  eventId?: string;
  label?: string;
  aspectRatio?: string; // e.g. "16/9", "1/1", "4/3"
}

export function ImageUpload({
  value,
  onChange,
  eventId,
  label,
  aspectRatio = "16/9",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (!eventId) {
        setError("Event ID is required to upload images");
        return;
      }
      setLoading(true);
      setProgress(0);
      try {
        // Remove existing image first.
        if (value) {
          const existingPath = extractPathFromUrl(value);
          if (existingPath) {
            await removeImage(existingPath).catch(() => {});
          }
        }
        const result = await uploadImage(file, eventId, setProgress);
        onChange(result.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setLoading(false);
        setProgress(0);
      }
    },
    [eventId, onChange, value],
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      const path = extractPathFromUrl(value);
      if (path) {
        await removeImage(path).catch(() => {});
      }
    }
    onChange(null);
  }, [onChange, value]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          dragging ? "border-gray-400 bg-gray-50" : "border-gray-200",
          loading && "pointer-events-none",
        )}
        style={{ aspectRatio }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Upload preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-100"
              >
                <Upload className="h-3.5 w-3.5" />
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600"
          >
            {loading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs">
                  {progress > 0 ? `Uploading ${progress}%` : "Processing..."}
                </span>
              </>
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-medium">Click or drag to upload</span>
              </>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
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
