import { supabase } from "./supabase";

const BUCKET = "event-images";
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export function extractPathFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split(`/${BUCKET}/`);
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }
    return null;
  } catch {
    return null;
  }
}

export async function compressImage(file: File): Promise<Blob> {
  const isPng = file.type === "image/png";
  const isGif = file.type === "image/gif";

  if (isGif) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  if (isPng) {
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("PNG compression failed"))),
        "image/png"
      );
    });
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("JPEG compression failed"))),
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

export async function uploadImage(
  file: File,
  path: string
): Promise<{ url: string; path: string }> {
  const compressed = await compressImage(file);
  const fileName = `${path}-${Date.now()}.${file.type === "image/png" ? "png" : "jpg"}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, compressed, {
      contentType: compressed.type,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return { url: data.publicUrl, path: fileName };
}

export async function removeImage(pathOrUrl: string): Promise<void> {
  const path = extractPathFromUrl(pathOrUrl) ?? pathOrUrl;
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
