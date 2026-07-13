import { useState, type ReactNode } from "react";
import { Upload, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function ImageUpload({
  value,
  onChange,
  label,
  bucket = "wedding-images",
  className,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  bucket?: string;
  className?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(fileName, file);
      if (upErr) {
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fileName);
        onChange(pub.publicUrl);
      } else {
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fileName);
        onChange(pub.publicUrl);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => onChange(reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      {label && <label className="block font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-2">{label}</label>}
      {value ? (
        <div className="relative group">
          <img src={value} alt="" className="w-full h-40 object-cover rounded-lg border border-[var(--color-border)]/20" />
          <button
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-[var(--color-border)]/30 rounded-lg cursor-pointer hover:border-[var(--color-primary)] transition-colors">
          <Upload size={20} className="text-[var(--color-text-muted)] mb-2" />
          <span className="font-ui text-xs text-[var(--color-text-muted)]">{uploading ? "Uploading..." : "Click to upload"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}

export function MediaUpload({ value, onChange, label, className }: { value: string | null; onChange: (v: string | null) => void; label?: string; className?: string }) {
  return <ImageUpload value={value} onChange={onChange} label={label} className={className} />;
}

export function VideoUpload({ value, onChange, label, className }: { value: string | null; onChange: (v: string | null) => void; label?: string; className?: string }) {
  return (
    <div className={className}>
      {label && <label className="block font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-2">{label}</label>}
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="Video URL (mp4)"
        className="w-full px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)]/30 text-[var(--color-text)] font-ui text-sm rounded-lg focus:outline-none focus:border-[var(--color-primary)]"
      />
    </div>
  );
}

export function FormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block font-ui text-xs uppercase tracking-wider-luxe text-[var(--color-text-muted)] mb-2">{label}</label>
      {children}
      {hint && <p className="font-ui text-xs text-[var(--color-text-muted)] mt-1">{hint}</p>}
    </div>
  );
}
