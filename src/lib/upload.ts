import { supabase } from "./supabase";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<Blob> {
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return file;
  }
  const hasAlpha = file.type === "image/png";
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        if (hasAlpha) {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to compress PNG"));
            },
            "image/png",
          );
        } else {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to compress JPEG"));
            },
            "image/jpeg",
            JPEG_QUALITY,
          );
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(
  file: File,
  bucket: string,
  pathPrefix: string,
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const compressed = await compressImage(file);
    const ext = file.name.toLowerCase().endsWith(".svg")
      ? "svg"
      : file.type === "image/png"
        ? "png"
        : "jpg";
    const fileName = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, compressed, {
        contentType: ext === "svg" ? "image/svg+xml" : ext === "png" ? "image/png" : "image/jpeg",
        upsert: false,
      });
    if (error) return { error: error.message };
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return { url: data.publicUrl, path: fileName };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }
}

export async function removeImage(bucket: string, path: string): Promise<{ error: string | null }> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error: error?.message ?? null };
}

export function extractPathFromUrl(url: string, bucket: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split(`/${bucket}/`);
    if (parts.length < 2) return null;
    return parts[parts.length - 1];
  } catch {
    return null;
  }
}
