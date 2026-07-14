import { supabase } from "./supabase";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export async function compressImage(file: File): Promise<Blob> {
  // Bypass SVG entirely — return as-is
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return file;
  }

  const img = await loadImage(file);
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
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, width, height);

  // Check if the image has transparency (PNG with alpha)
  const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
  let hasTransparency = false;

  if (isPng) {
    try {
      const imageData = ctx.getImageData(0, 0, Math.min(width, 100), Math.min(height, 100));
      hasTransparency = imageData.data.some((_, i) => {
        if (i % 4 === 3) {
          return imageData.data[i] < 255;
        }
        return false;
      });
    } catch {
      hasTransparency = true;
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    if (isPng && hasTransparency) {
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
  });
}

export async function uploadImage(
  file: File,
  bucket: string,
  path: string,
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const compressed = await compressImage(file);
    const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const ext = compressed.type === "image/png" ? "png" : "jpg";
    const fullPath = `${fileName}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, compressed, {
        contentType: compressed.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) return { error: error.message };

    const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath);
    return { url: data.publicUrl, path: fullPath };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { error: message };
  }
}

export async function removeImage(bucket: string, path: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Remove failed";
    return { error: message };
  }
}

export function extractPathFromUrl(url: string, bucket: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const bucketIdx = parts.indexOf(bucket);
    if (bucketIdx === -1 || bucketIdx + 1 >= parts.length) return null;
    return parts.slice(bucketIdx + 1).join("/");
  } catch {
    return null;
  }
}
