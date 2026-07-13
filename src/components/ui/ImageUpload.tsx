import { useState, useCallback, useRef } from "react";
import { uploadImage, removeImage, extractPathFromUrl } from "../../lib/upload";
import { cn } from "../../lib/utils";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  eventId?: string;
  label?: string;
  className?: string;
  aspectRatio?: "square" | "video" | "wide" | "auto";
}

export function ImageUpload({ value, onChange, eventId = "general", label, className, aspectRatio = "video" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10MB"); return; }
    setError(null);
    setUploading(true);
    setProgress(0);

    let progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 200);

    try {
      const result = await uploadImage(file, eventId);
      clearInterval(progressInterval);
      setProgress(100);
      onChange(result.url);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 500);
    }
  }, [eventId, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(async () => {
    const path = extractPathFromUrl(value);
    if (path) await removeImage(path);
    onChange("");
  }, [value, onChange]);

  const aspectClass = aspectRatio === "square" ? "aspect-square" : aspectRatio === "wide" ? "aspect-[21/9]" : aspectRatio === "auto" ? "" : "aspect-video";

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      {value && !uploading ? (
        <div className="relative group">
          <img src={value} alt="Preview" className={cn("w-full object-cover rounded-lg border border-gray-200", aspectClass)} />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 text-xs font-medium text-white bg-black/70 rounded-lg hover:bg-black/90 transition-colors flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Replace
            </button>
            <button type="button" onClick={handleRemove} className="px-3 py-1.5 text-xs font-medium text-white bg-red-600/80 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : uploading ? (
        <div className={cn("w-full rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3", aspectClass)}>
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <div className="w-3/4 max-w-xs">
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full rounded-full bg-black transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">Uploading... {Math.round(progress)}%</p>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 p-6",
            aspectClass,
            dragOver ? "border-gray-900 bg-gray-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50/50"
          )}
        >
          <ImageIcon className="w-8 h-8 text-gray-300" />
          <div className="text-center">
            <p className="text-sm text-gray-600 font-medium">Click to upload or drag & drop</p>
            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 10MB</p>
          </div>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = ""; }}
      />
    </div>
  );
}
