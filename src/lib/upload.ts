import { supabase } from "./supabase";

const MAX_WIDTH = 2000;
const MAX_HEIGHT = 2000;
const JPEG_QUALITY = 0.82;

function isSvgFile(file: File | Blob): boolean {
  if (file instanceof File) {
    return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
  }
  return file.type === "image/svg+xml";
}

function hasAlphaChannel(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const { width, height } = canvas;
  if (width === 0 || height === 0) return false;
  const sample = Math.min(width * height, 4096);
  const step = Math.max(1, Math.floor((width * height) / sample));
  let checked = 0;
  for (let y = 0; y < height; y += Math.floor(Math.sqrt(step))) {
    for (let x = 0; x < width; x += Math.floor(Math.sqrt(step))) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      if (pixel[3] < 255) return true;
      checked++;
      if (checked >= sample) break;
    }
  }
  return false;
}

export async function compressImage(
  file: File | Blob,
  opts: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<Blob> {
  const maxWidth = opts.maxWidth ?? MAX_WIDTH;
  const maxHeight = opts.maxHeight ?? MAX_HEIGHT;
  const quality = opts.quality ?? JPEG_QUALITY;

  // Bypass SVG entirely — return as-is
  if (isSvgFile(file)) {
    return file;
  }

  const bitmap = await loadImageBitmap(file);
  let { width, height } = bitmap;

  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);

  const isPng = file instanceof File && file.type === "image/png";
  const hasAlpha = isPng && hasAlphaChannel(canvas);

  // Use PNG format for transparent images, JPEG for opaque
  if (hasAlpha) {
    return new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob ?? file),
        "image/png"
      );
    });
  }

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ?? file),
      "image/jpeg",
      quality
    );
  });
}

function loadImageBitmap(file: File | Blob): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  // Fallback for older browsers
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img as unknown as ImageBitmap);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export async function uploadImage(
  file: File,
  bucket: string,
  pathPrefix: string
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const compressed = await compressImage(file);
    const ext = compressed.type === "image/png" ? "png" : "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const path = `${pathPrefix}/${fileName}`;

    const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
      contentType: compressed.type,
      upsert: false,
    });

    if (error) return { error: error.message };

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
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
    const prefix = `/storage/v1/object/public/${bucket}/`;
    const idx = u.pathname.indexOf(prefix);
    if (idx === -1) return null;
    return u.pathname.slice(idx + prefix.length);
  } catch {
    return null;
  }
}
