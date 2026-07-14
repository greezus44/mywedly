import { useState, useRef, useCallback, type DragEvent } from "react";
import { uploadImage, removeImage } from "../../lib/upload";
import { cn } from "../../lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  userId: string;
  label?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, userId, label, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const url = await uploadImage(file, userId);
        if (value) await removeImage(value).catch(() => {});
        onChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [value, onChange, userId],
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-sm font-medium text-dash-text">{label}</label>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragOver ? "border-dash-primary bg-dash-primary/5" : "border-dash-border bg-dash-surface hover:bg-dash-bg",
        )}
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-sm text-dash-muted">
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Uploading...
          </div>
        ) : value ? (
          <div className="relative w-full">
            <img src={value} alt="Preview" className="mx-auto max-h-48 rounded-lg object-contain" />
            <p className="mt-2 text-xs text-dash-muted">Click to replace</p>
          </div>
        ) : (
          <>
            <svg className="mb-2 h-8 w-8 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-sm text-dash-muted">Drag & drop or click to upload</p>
          </>
        )}
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
      {error && <p className="text-sm text-dash-danger">{error}</p>}
      {value && !uploading && (
        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            await removeImage(value).catch(() => {});
            onChange(null);
          }}
          className="text-xs text-dash-danger hover:underline"
        >
          Remove image
        </button>
      )}
    </div>
  );
}
