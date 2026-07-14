import React, { useRef, useState } from "react";
import { Button } from "./Button";
import { uploadImage } from "../../lib/upload";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  bucket?: string;
}

export function ImageUpload({ value, onChange, label, bucket = "event-assets" }: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const url = await uploadImage(file, bucket, path);
    if (url) onChange(url);
    setUploading(false);
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="Preview" className="w-16 h-16 object-cover rounded-lg border" />}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Remove
          </Button>
        )}
      </div>
      {value && <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-xs" />}
    </div>
  );
}
