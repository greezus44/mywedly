import React, { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";

interface ImageUploadProps {
  value: string | null; onChange: (url: string | null) => void;
  eventId?: string; label?: string; aspectRatio?: string;
}

export function ImageUpload({ value, onChange, eventId = "temp", label, aspectRatio = "16/9" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadImage(file, eventId);
      if (value) { const oldPath = extractPathFromUrl(value); if (oldPath) { try { await removeImage(oldPath); } catch {} } }
      onChange(url);
    } catch { alert("Failed to upload image. Please try again."); }
    finally { setUploading(false); }
  };

  const handleRemove = async () => {
    if (value) { const path = extractPathFromUrl(value); if (path) { try { await removeImage(path); } catch {} } }
    onChange(null);
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-dash-text mb-1">{label}</label>}
      {value ? (
        <div className="relative group">
          <img src={value} alt="" className={cn("w-full rounded-lg border border-dash-border object-cover")} style={{ aspectRatio }} />
          <button onClick={handleRemove} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }} className={cn("flex flex-col items-center justify-center cursor-pointer rounded-lg border-2 border-dashed transition-colors", dragOver ? "border-dash-primary bg-dash-primary-light" : "border-dash-border hover:border-dash-primary", uploading && "opacity-50")} style={{ aspectRatio }}>
          {uploading ? <p className="text-sm text-dash-muted">Uploading...</p> : (<><Upload className="w-8 h-8 text-dash-muted mb-2" /><p className="text-sm text-dash-muted">Click or drag to upload</p></>)}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}
