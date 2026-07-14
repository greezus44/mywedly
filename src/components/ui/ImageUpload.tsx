import { useState, useRef, useCallback, type DragEvent } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  userId: string;
  label?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, userId, label, className }: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    setError(null); setUploading(true);
    try {
      const url = await uploadImage(file, userId);
      if (value) { try { const p = extractPathFromUrl(value); if (p) await removeImage(value); } catch { /* ignore */ } }
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload image");
    } finally { setUploading(false); }
  }, [userId, value, onChange]);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = async () => {
    if (value) { try { await removeImage(value); } catch { /* ignore */ } }
    onChange("");
  };

  return (
    <div className={cn("w-full", className)}>
      {label && <label className="mb-1.5 block text-sm font-medium text-dash-text">{label}</label>}
      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-dash-border">
          <img src={value} alt="Preview" className="h-48 w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-2">
            <button onClick={() => inputRef.current?.click()} className="rounded-md bg-dash-surface px-2 py-1 text-xs text-dash-text shadow hover:bg-dash-bg">Replace</button>
            <button onClick={handleRemove} className="rounded-md bg-dash-danger px-2 py-1 text-xs text-dash-danger-fg shadow hover:bg-dash-danger-hover">Remove</button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
            dragging ? "border-dash-primary bg-dash-primary/5" : "border-dash-border bg-dash-surface hover:bg-dash-bg"
          )}
        >
          {uploading ? (
            <svg className="h-8 w-8 animate-spin text-dash-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <>
              <svg className="mb-2 h-8 w-8 text-dash-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-dash-muted">Click or drag to upload</p>
            </>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-dash-danger">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </div>
  );
}
