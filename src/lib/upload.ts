import { supabase } from "./supabase";

const BUCKET = "event-images";
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

function isSvg(file: File | Blob): boolean {
  return file.type === "image/svg+xml" || file.type === "image/svg";
}

function hasTransparency(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    const data = ctx.getImageData(0, 0, Math.min(w, 50), Math.min(h, 50)).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function compressImage(
  file: File,
  maxDimension = MAX_DIMENSION,
  quality = JPEG_QUALITY
): Promise<Blob> {
  // Bypass SVG entirely — return as-is
  if (isSvg(file)) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const ratio = Math.min(maxDimension / width, maxDimension / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Preserve alpha for PNGs — use PNG format for transparent images, JPEG for opaque
  const transparent = hasTransparency(ctx, width, height);
  if (transparent) {
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob ?? file), "image/png");
    });
  }
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", quality);
  });
}

export async function uploadImage(
  file: File,
  pathPrefix: string
): Promise<{ url: string; path: string } | null> {
  try {
    const compressed = await compressImage(file);
    const ext = isSvg(file) ? "svg" : compressed.type === "image/png" ? "png" : "jpg";
    const fileName = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, compressed, {
        contentType: compressed.type || file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return { url: data.publicUrl, path: fileName };
  } catch (err) {
    console.error("uploadImage error:", err);
    return null;
  }
}

export async function removeImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      console.error("Remove error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("removeImage error:", err);
    return false;
  }
}

export function extractPathFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const bucketIdx = parts.indexOf(BUCKET);
    if (bucketIdx === -1) return null;
    return parts.slice(bucketIdx + 1).join("/");
  } catch {
    return null;
  }
}
