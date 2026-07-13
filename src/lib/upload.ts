import { supabase } from "./supabase";

const BUCKET = "event-images";

export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.82,
): Promise<Blob> {
  // Only compress raster images; SVGs and others are returned as-is.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  const img = bitmap ?? (await loadImage(URL.createObjectURL(file)));

  const scale = Math.min(1, maxWidth / img.width);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img as CanvasImageSource, 0, 0, width, height);

  const isPng = file.type === "image/png";
  const mime = isPng ? "image/png" : "image/jpeg";
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
      mime,
      quality,
    );
  });

  // Only use the compressed blob if it's actually smaller.
  return blob.size < file.size ? blob : file;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

export interface UploadResult {
  url: string;
  path: string;
}

export async function uploadImage(
  file: File,
  eventId: string,
  onProgress?: (progress: number) => void,
): Promise<UploadResult> {
  const compressed = await compressImage(file);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext) ? ext : "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
  const path = `${eventId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, {
      cacheControl: "3600",
      upsert: false,
      contentType: compressed.type || file.type,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const uploadedPath = data?.path ?? path;
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(uploadedPath);

  onProgress?.(100);
  return { url: publicUrlData.publicUrl, path: uploadedPath };
}

export async function removeImage(path: string): Promise<void> {
  if (!path) return;
  const cleanPath = extractPathFromUrl(path);
  const { error } = await supabase.storage.from(BUCKET).remove([cleanPath]);
  if (error) {
    throw new Error(`Remove failed: ${error.message}`);
  }
}

export function extractPathFromUrl(url: string): string {
  if (!url) return "";
  // If it's already just a path, return it.
  if (!url.startsWith("http")) return url.replace(/^\//, "");
  try {
    const u = new URL(url);
    // Supabase public URLs look like:
    // https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const parts = u.pathname.split("/storage/v1/object/public/");
    if (parts.length > 1) {
      const rest = parts[1];
      const slashIdx = rest.indexOf("/");
      return slashIdx >= 0 ? rest.slice(slashIdx + 1) : "";
    }
    // Signed URLs: /storage/v1/object/sign/<bucket>/<path>
    const signParts = u.pathname.split("/storage/v1/object/sign/");
    if (signParts.length > 1) {
      const rest = signParts[1];
      const slashIdx = rest.indexOf("/");
      return slashIdx >= 0 ? rest.slice(slashIdx + 1).split("?")[0] : "";
    }
    // Fallback: take everything after the bucket name.
    const segments = u.pathname.split("/").filter(Boolean);
    const bucketIdx = segments.indexOf(BUCKET);
    if (bucketIdx >= 0 && bucketIdx < segments.length - 1) {
      return segments.slice(bucketIdx + 1).join("/");
    }
    return segments.join("/");
  } catch {
    return url;
  }
}
