import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";
interface ImageUploadProps { value: string; onChange: (url: string) => void; eventId?: string; label?: string; aspectRatio?: string; }
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
    try { const result = await uploadImage(file, eventId, setProgress); if (value) { const oldPath = extractPathFromUrl(value); if (oldPath) { try { await removeImage(oldPath); } catch { /* ignore */ } } } onChange(result.url); }
    catch (err) { setError(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); setProgress(0); }
  }, [eventId, value, onChange]);
  const handleRemove = useCallback(async () => { if (value) { const path = extractPathFromUrl(value); if (path) { try { await removeImage(path); } catch { /* ignore */ } } } onChange(""); }, [value, onChange]);
  return (
    <div>
      {label && <label className="block text-xs font-medium uppercase tracking-wider text-onyx/60 mb-1.5">{label}</label>}
      {value && !uploading ? (
        <div className="relative group overflow-hidden border border-onyx/10" style={{ aspectRatio }}>
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-onyx/0 group-hover:bg-onyx/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button type="button" onClick={handleRemove} className="p-2 bg-white/90 hover:bg-white"><X className="w-4 h-4 text-onyx" /></button>
          </div>
        </div>
      ) : uploading ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-onyx/20 bg-cream/30 p-8" style={{ aspectRatio }}>
          <Loader2 className="w-6 h-6 text-onyx/40 animate-spin mb-2" /><span className="text-sm text-onyx/50">Uploading... {progress}%</span>
          <div className="w-full max-w-xs mt-3 h-1 bg-onyx/10"><div className="h-full bg-onyx transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      ) : (
        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }} onClick={() => inputRef.current?.click()} className={cn("flex flex-col items-center justify-center border border-dashed cursor-pointer transition-colors p-8", dragOver ? "border-onyx bg-cream/30" : "border-onyx/20 hover:border-onyx/40 hover:bg-cream/20")} style={{ aspectRatio }}>
          <Upload className="w-6 h-6 text-onyx/30 mb-2" /><span className="text-sm text-onyx/50">Click or drag to upload</span><span className="text-xs text-onyx/30 mt-1">JPG, PNG, WebP</span>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
    </div>
  );
}
