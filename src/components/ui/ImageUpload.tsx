import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  eventId?: string;
  label?: string;
  aspectRatio?: string;
}

export function ImageUpload({ value, onChange, eventId, label, aspectRatio = "16/9" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!eventId) { setError("Event must be saved before uploading images"); return; }
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    setUploading(true); setError(null); setProgress(0);
    try {
      const result = await uploadImage(file, eventId, setProgress);
      if (value) { const oldPath = extractPathFromUrl(value); if (oldPath) { try { await removeImage(oldPath); } catch { /* ignore */ } } }
      onChange(result.url);
    } catch (err) { setError(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); setProgress(0); }
  }, [eventId, value, onChange]);

  const handleRemove = useCallback(async () => {
    if (value) { const path = extractPathFromUrl(value); if (path) { try { await removeImage(path); } catch { /* ignore */ } } }
    onChange("");
  }, [value, onChange]);

  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      {value && !uploading ? (
        <div className="relative group rounded-lg overflow-hidden border border-slate-200" style={{ aspectRatio }}>
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button type="button" onClick={handleRemove} className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white"><X className="w-4 h-4 text-slate-700" /></button>
          </div>
        </div>
      ) : uploading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8" style={{ aspectRatio }}>
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin mb-2" />
          <span className="text-sm text-slate-500">Uploading... {progress}%</span>
          <div className="w-full max-w-xs mt-3 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      ) : (
        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }} onClick={() => inputRef.current?.click()} className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed cursor-pointer transition-colors p-8", dragOver ? "border-slate-900 bg-slate-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50")} style={{ aspectRatio }}>
          <Upload className="w-6 h-6 text-slate-400 mb-2" />
          <span className="text-sm text-slate-500">Click or drag to upload</span>
          <span className="text-xs text-slate-400 mt-1">JPG, PNG, WebP</span>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </div>
  );
}
