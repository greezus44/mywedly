import React, { useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { uploadImage, removeImage } from "../../lib/upload";

export function ImageUpload({
  value,
  onChange,
  eventId,
  className,
  label,
  aspect = "aspect-video",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  eventId: string;
  className?: string;
  label?: string;
  aspect?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadImage(file, eventId);
      if (value) await removeImage(value).catch(() => {});
      onChange(url);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-dash-text mb-1.5">{label}</label>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith("image/")) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative cursor-pointer rounded-xl border-2 border-dashed transition-colors",
          aspect,
          dragging ? "border-dash-primary bg-dash-primary/5" : "border-dash-border hover:border-dash-primary/50",
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Uploaded" className="absolute inset-0 h-full w-full object-cover rounded-xl" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors rounded-xl flex items-center justify-center opacity-0 hover:opacity-100">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(null); removeImage(value).catch(() => {}); }}
                className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-dash-muted">
            {uploading ? (
              <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <svg className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-sm">Click or drag to upload</span>
              </>
            )}
          </div>
        )}
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
    </div>
  );
}
