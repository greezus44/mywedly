import { supabase } from "./supabase";

export async function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width, height = img.height;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error("Compression failed")); }, "image/jpeg", quality);
      };
      img.onerror = reject; img.src = e.target?.result as string;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File, eventId: string): Promise<{ url: string; path: string }> {
  const compressed = await compressImage(file);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${eventId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const { error } = await supabase.storage.from("event-images").upload(path, compressed, { contentType: "image/jpeg" });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
  return { url: urlData.publicUrl, path };
}

export async function removeImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from("event-images").remove([path]);
  if (error) throw error;
}

export function extractPathFromUrl(url: string): string | null {
  try { const u = new URL(url); const parts = u.pathname.split("/"); const idx = parts.indexOf("event-images"); if (idx === -1) return null; return parts.slice(idx + 1).join("/"); } catch { return null; }
}
