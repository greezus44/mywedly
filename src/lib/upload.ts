import { supabase } from "./supabase";

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.85 } = options;

  // Bypass SVG entirely
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return file;
  }

  // For non-image files, return as-is
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const img = await loadImage(file);
  let { width, height } = img;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, width, height);

  // Preserve alpha for PNGs; use JPEG for opaque images
  const isPng = file.type === "image/png";
  const hasAlpha = isPng;

  if (hasAlpha) {
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".png"), {
      type: "image/png",
    });
  }

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

export async function uploadImage(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const compressed = await compressImage(file);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, compressed, {
      cacheControl: "3600",
      upsert: true,
    });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeImage(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export function extractPathFromUrl(url: string, bucket: string): string | null {
  try {
    const u = new URL(url);
    const prefix = `/object/public/${bucket}/`;
    const idx = u.pathname.indexOf(prefix);
    if (idx === -1) return null;
    return u.pathname.slice(idx + prefix.length);
  } catch {
    return null;
  }
}
