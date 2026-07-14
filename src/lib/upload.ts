import { supabase } from "./supabase";

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

function isSvg(file: File | Blob): boolean {
  if (file instanceof File) {
    return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
  }
  return file.type === "image/svg+xml";
}

function isPng(file: File | Blob): boolean {
  if (file instanceof File) {
    return file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
  }
  return file.type === "image/png";
}

export async function compressImage(
  file: File | Blob,
  opts: CompressOptions = {},
): Promise<Blob> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.82 } = opts;

  if (isSvg(file)) {
    return file;
  }

  const hasAlpha = isPng(file);

  const bitmap = await loadImageBitmap(file);
  let { width, height } = bitmap;
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
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise<Blob>((resolve) => {
    const type = hasAlpha ? "image/png" : "image/jpeg";
    const q = hasAlpha ? undefined : quality;
    canvas.toBlob(
      (blob) => {
        resolve(blob ?? file);
      },
      type,
      q,
    );
  });
}

function loadImageBitmap(file: File | Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file).catch(() => loadImageElement(file));
  }
  return loadImageElement(file);
}

function loadImageElement(file: File | Blob): Promise<HTMLImageElement> {
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

export async function uploadImage(
  file: File,
  bucket: string,
  path: string,
  opts?: CompressOptions,
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    let blob: Blob = file;
    if (!isSvg(file)) {
      blob = await compressImage(file, opts);
    }
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        upsert: true,
        contentType: blob.type || file.type,
      });
    if (error) return { error: error.message };
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return { url: urlData.publicUrl, path: data.path };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }
}

export async function removeImage(bucket: string, path: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Remove failed" };
  }
}

export function extractPathFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const objectPathIdx = parts.findIndex((p) => p === "object");
    if (objectPathIdx !== -1) {
      return parts.slice(objectPathIdx + 1).join("/");
    }
    return parts.slice(-1)[0] ?? "";
  } catch {
    return url;
  }
}
