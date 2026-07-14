import { useRef, useState, type DragEvent } from "react";
import { uploadImage } from "../../lib/upload";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

interface ImageUploadProps {
  userId: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ userId, value, onChange, label, className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file, userId);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors",
          dragging ? "border-dash-primary bg-dash-primary/5" : "border-dash-border bg-dash-bg hover:border-dash-primary/50",
        )}
      >
        {value ? (
          <div className="relative w-full">
            <img src={value} alt="Preview" className="mx-auto max-h-48 rounded-lg object-contain" />
            <div className="mt-2 flex justify-center gap-2">
              <Button type="button" size="sm" variant="secondary" loading={uploading}>Replace</Button>
              <Button type="button" size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); onChange(null); }}>Remove</Button>
            </div>
          </div>
        ) : (
          <>
            <svg className="mb-2 h-8 w-8 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            <p className="text-sm text-dash-muted">{uploading ? "Uploading..." : "Drag & drop or click to upload"}</p>
            <p className="mt-1 text-xs text-dash-muted">PNG, JPG up to ~5MB</p>
          </>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}
