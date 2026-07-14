import { supabase } from "./supabase";

const BUCKET = "event-assets";
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.82;

function isSvgFile(file: File): boolean {
  return file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
}

function hasTransparency(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    const { width, height } = canvas;
    // sample a subset of pixels for performance
    const step = Math.max(1, Math.floor(Math.min(width, height) / 100));
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const data = ctx.getImageData(x, y, 1, 1).data;
        if (data[3] < 255) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
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

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert canvas to blob"));
      },
      type,
      quality,
    );
  });
}

export async function compressImage(file: File): Promise<File> {
  // bypass SVG entirely — no canvas compression for vector graphics
  if (isSvgFile(file)) return file;

  // non-image files pass through
  if (!file.type.startsWith("image/")) return file;

  try {
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

    const transparent = hasTransparency(canvas);
    // preserve alpha for transparent images — use PNG; only JPEG for opaque
    const outType = transparent ? "image/png" : "image/jpeg";
    const blob = await canvasToBlob(canvas, outType, JPEG_QUALITY);
    const outName = file.name.replace(/\.(png|jpe?g|webp|gif)$/i, transparent ? ".png" : ".jpg");
    return new File([blob], outName, { type: outType });
  } catch {
    // if anything fails, return the original file untouched
    return file;
  }
}

export async function uploadImage(
  file: File,
  folder: string,
  eventId: string,
): Promise<string> {
  const compressed = await compressImage(file);
  const ext = compressed.name.split(".").pop() || "jpg";
  const path = `${eventId}/${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    cacheControl: "3600",
    upsert: false,
    contentType: compressed.type,
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
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split(`/object/public/${BUCKET}/`);
    if (parts.length > 1) return decodeURIComponent(parts[1]);
    // fallback: try last 4 segments after /event-assets/
    const idx = u.pathname.indexOf(`/${BUCKET}/`);
    if (idx !== -1) return decodeURIComponent(u.pathname.slice(idx + BUCKET.length + 1));
    return null;
  } catch {
    return null;
  }
}
