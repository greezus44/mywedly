import { supabase } from "./supabase";

export interface UploadedImage {
  path: string;
  url: string;
}

function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.82): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) { resolve(new File([blob], file.name, { type: file.type || "image/jpeg" })); }
          else resolve(file);
        }, file.type === "image/png" ? "image/png" : "image/jpeg", quality);
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File, eventId: string, onProgress?: (progress: number) => void): Promise<UploadedImage> {
  const compressed = await compressImage(file);
  const ext = compressed.name.split(".").pop() || "jpg";
  const fileName = `${eventId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage.from("event-images").upload(fileName, compressed, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(fileName);
  return { path: fileName, url: urlData.publicUrl };
}

export async function removeImage(path: string): Promise<void> {
  if (!path) return;
  try {
    await supabase.storage.from("event-images").remove([path]);
  } catch {}
}

export function extractPathFromUrl(url: string): string {
  if (!url) return "";
  try {
    const parts = url.split("/event-images/");
    if (parts.length > 1) return parts[1];
  } catch {}
  return "";
}
