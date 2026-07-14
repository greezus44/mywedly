import { supabase } from "./supabase";

const BUCKET = "event-images";
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

async function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function compressImage(file: File): Promise<Blob> {
  const img = await fileToImage(file);
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
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, width, height);
  const isPng = file.type === "image/png";
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      isPng ? "image/png" : "image/jpeg",
      isPng ? undefined : JPEG_QUALITY
    );
  });
  return blob;
}

export async function uploadImage(
  file: File,
  eventId: string
): Promise<string> {
  const blob = await compressImage(file);
  const ext = file.type === "image/png" ? "png" : "jpg";
  const path = `${eventId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeImage(url: string): Promise<void> {
  const path = extractPathFromUrl(url);
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export function extractPathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const idx = parts.indexOf(BUCKET);
    if (idx === -1) return null;
    return parts.slice(idx + 1).join("/");
  } catch {
    return null;
  }
}
