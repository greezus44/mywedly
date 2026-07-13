import { supabase } from "./supabase";

const BUCKET = "event-images";

/**
 * Compress an image file using a canvas. Returns a JPEG Blob.
 */
export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.82,
): Promise<Blob> {
  // If it's not an image, just return the original file.
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, width, height);

  // PNGs with transparency → keep as PNG, otherwise JPEG for compression.
  const isPng = file.type === "image/png";
  const mime = isPng ? "image/png" : "image/jpeg";

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob ?? file);
      },
      mime,
      quality,
    );
  });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload an image to the `event-images` bucket. Compresses first.
 * Returns the public URL and storage path.
 */
export async function uploadImage(
  file: File,
  eventId: string,
  onProgress?: (progress: number) => void,
): Promise<UploadResult> {
  onProgress?.(5);

  const compressed = await compressImage(file);
  onProgress?.(30);

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${eventId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, {
      cacheControl: "3600",
      upsert: false,
      contentType: compressed.type,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  onProgress?.(70);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  onProgress?.(100);

  return { url: data.publicUrl, path };
}

/**
 * Remove an image from storage by its path.
 */
export async function removeImage(path: string): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    throw new Error(`Remove failed: ${error.message}`);
  }
}

/**
 * Extract the storage path from a public URL.
 * e.g. https://xxxx.supabase.co/storage/v1/object/public/event-images/abc/123.jpg → abc/123.jpg
 */
export function extractPathFromUrl(url: string): string {
  if (!url) return "";
  const marker = `/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return "";
  return url.slice(idx + marker.length);
}
