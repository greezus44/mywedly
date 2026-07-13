import { useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Upload, X, Film } from "lucide-react";

export function ImageUpload({ value, onChange, label, bucket = "wedding-images", className }: { value: string | null; onChange: (url: string | null) => void; label?: string; bucket?: string; className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>}
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="preview" className="h-32 rounded-lg border border-gray-200 object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition"
        >
          {uploading ? <span className="text-sm">Uploading...</span> : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="h-6 w-6" />
              <span className="text-sm">Upload image</span>
            </div>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
    </div>
  );
}

export function VideoUpload({ value, onChange, label, className }: { value: string | null; onChange: (v: string | null) => void; label?: string; className?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("wedding-images").upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("wedding-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>}
      {value ? (
        <div className="relative inline-block">
          <video src={value} className="h-32 rounded-lg border border-gray-200 object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition"
        >
          {uploading ? <span className="text-sm">Uploading...</span> : (
            <div className="flex flex-col items-center gap-1">
              <Film className="h-6 w-6" />
              <span className="text-sm">Upload video</span>
            </div>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
    </div>
  );
}

export function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
