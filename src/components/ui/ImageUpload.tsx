import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";

export interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  eventId?: string;
  label?: string;
  aspectRatio?: string;
}

export function ImageUpload({
  value,
  onChange,
  eventId,
  label,
  aspectRatio = "16 / 9",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      if (!eventId) {
        setError("An event ID is required to upload images.");
        return;
      }
      setLoading(true);
      try {
        const { url } = await uploadImage(file, eventId, (p) => {
          // progress is reported but we only show a spinner here
          void p;
        });
        if (value) {
          const oldPath = extractPathFromUrl(value);
          if (oldPath) await removeImage(oldPath).catch(() => {});
        }
        onChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setLoading(false);
      }
    },
    [eventId, onChange, value],
  );

  const handleRemove = useCallback(async () => {
    if (value) {
      const path = extractPathFromUrl(value);
      if (path) await removeImage(path).catch(() => {});
    }
    onChange("");
  }, [onChange, value]);

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          dragging ? "border-gray-900 bg-gray-50" : "border-gray-300 bg-gray-50",
        )}
        style={{ aspectRatio }}
      >
        {value ? (
          <>
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-white"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-md bg-white/90 p-1.5 text-gray-900 hover:bg-white"
                aria-label="Remove image"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-2 text-gray-500"
          >
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <ImagePlus className="h-8 w-8" />
            )}
            <span className="text-sm">
              {loading ? "Uploading..." : "Click or drag to upload"}
            </span>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
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
