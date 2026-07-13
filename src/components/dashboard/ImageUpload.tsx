import { useRef, useState } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = { weddingId: string; value: string | null; onChange: (url: string | null) => void; label?: string };

export function ImageUpload({ weddingId, value, onChange, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (file.size > 5 * 1024 * 1024) { setError("File too large (max 5MB)"); return; }
    if (!file.type.startsWith("image/")) { setError("Please upload an image file"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${weddingId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("wedding-images").upload(path, file);
    if (upErr) {
      if (upErr.message.includes("Bucket not found")) {
        const { error: mkErr } = await supabase.storage.createBucket("wedding-images", { public: true });
        if (!mkErr) { const { error: upErr2 } = await supabase.storage.from("wedding-images").upload(path, file); if (upErr2) { setError(upErr2.message); setUploading(false); return; } }
        else { setError("Storage not configured"); setUploading(false); return; }
      } else { setError(upErr.message); setUploading(false); return; }
    }
    const { data: urlData } = supabase.storage.from("wedding-images").getPublicUrl(path);
    onChange(urlData.publicUrl);
    setUploading(false);
  };

  return (
    <div>
      {label && <label className="text-xs uppercase tracking-widest text-sepia block mb-2">{label}</label>}
      {value ? (
        <div className="relative group">
          <img src={value} alt="" className="w-full max-w-xs rounded-md border border-onyx/10" />
          <button onClick={() => onChange(null)} className="absolute top-2 right-2 bg-onyx/80 text-parchment p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) upload(f); }} className="border-2 border-dashed border-onyx/20 rounded-md p-6 text-center cursor-pointer hover:border-sepia/40 transition-colors">
          {uploading ? <p className="text-sepia text-sm">Uploading…</p> : <><ImageIcon className="w-8 h-8 text-sepia/40 mx-auto mb-2" /><p className="text-sepia text-sm">Click or drag to upload</p></>}
        </div>
      )}
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
    </div>
  );
}
