import { supabase } from "./supabase";

const BUCKET = "event-assets";

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function isSvg(filename: string): boolean {
  return getExtension(filename) === "svg";
}

function isPng(filename: string): boolean {
  return getExtension(filename) === "png";
}

function loadImage(file: File): Promise<HTMLImageElement> {
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

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      type,
      quality
    );
  });
}

export async function compressImage(
  file: File,
  maxSize = 1600,
  quality = 0.82
): Promise<File> {
  if (isSvg(file.name)) {
    return file;
  }
  const img = await loadImage(file);
  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    if (width >= height) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    } else {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  const png = isPng(file.name);
  const type = png ? "image/png" : "image/jpeg";
  const blob = await canvasToBlob(canvas, type, png ? 1 : quality);
  const outName = file.name.replace(/\.(png|jpe?g|webp)$/i, png ? ".png" : ".jpg");
  return new File([blob], outName, { type });
}

export async function uploadImage(
  file: File,
  path: string
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const compressed = await compressImage(file);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, compressed, { upsert: true });
    if (error) return { error: error.message };
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    return { url: urlData.publicUrl, path: data.path };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }
}

export async function removeImage(path: string): Promise<{ error: string | null }> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return { error: error?.message ?? null };
}

export function extractPathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const idx = parts.indexOf("object");
    if (idx === -1) return null;
    return decodeURIComponent(parts.slice(idx + 1).join("/"));
  } catch {
    return null;
  }
}
