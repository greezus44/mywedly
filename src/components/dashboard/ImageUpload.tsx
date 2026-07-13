import { useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

type Props = {
  weddingId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  className?: string;
};

export function ImageUpload({ weddingId, value, onChange, label, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      if (file.size > MAX_SIZE) {
        toast.error("Image must be under 5 MB");
        return;
      }
      if (!ACCEPTED.includes(file.type)) {
        toast.error("Only JPG, PNG, WebP, GIF, and SVG are allowed");
        return;
      }
      setUploading(true);
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${weddingId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("wedding-assets")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("wedding-assets").getPublicUrl(path);
        onChange(pub.publicUrl);
        toast.success("Image uploaded");
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [weddingId, onChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) upload(file);
    },
    [upload],
  );

  return (
    <div className={className}>
      {label && <label className="eyebrow block mb-2">{label}</label>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-lg cursor-pointer transition-colors overflow-hidden ${
          dragging ? "border-onyx bg-mist/50" : "border-onyx/20 hover:border-onyx/40"
        }`}
        style={{ minHeight: value ? "auto" : "120px" }}
      >
        {value ? (
          <div className="relative group">
            <img src={value} alt="" className="w-full max-h-64 object-cover" />
            <div className="absolute inset-0 bg-onyx/0 group-hover:bg-onyx/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="bg-parchment text-onyx px-3 py-2 text-xs uppercase tracking-widest"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="bg-destructive text-parchment p-2"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Upload className="w-6 h-6 text-onyx/40 mb-2" />
            <p className="text-xs text-onyx/50">
              {uploading ? "Uploading…" : "Drag & drop or click to upload"}
            </p>
            <p className="text-[10px] text-onyx/30 mt-1">JPG, PNG, WebP — max 5 MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
