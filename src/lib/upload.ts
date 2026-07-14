import { supabase } from "./supabase";

const BUCKET_NAME = "event-images";

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.82 } = options;

  // Bypass SVG - return as-is
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return file;
  }

  // Preserve alpha for PNGs by using PNG output
  const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
  const outputType = isPng ? "image/png" : "image/jpeg";
  const outputQuality = isPng ? undefined : quality;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const out = new File([blob], file.name, { type: outputType });
            resolve(out);
          },
          outputType,
          outputQuality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(
  file: File,
  userId: string
): Promise<string> {
  if (!file) throw new Error("No file provided");
  if (!userId) throw new Error("You must be signed in to upload images");

  let fileToUpload = file;
  // Compress if it's a raster image (not SVG)
  if (file.type !== "image/svg+xml" && !file.name.toLowerCase().endsWith(".svg")) {
    try {
      fileToUpload = await compressImage(file);
    } catch {
      // If compression fails, fall back to original
      fileToUpload = file;
    }
  }

  const timestamp = Date.now();
  const safeName = fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${userId}/${timestamp}-${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, fileToUpload, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    if (error.message?.toLowerCase().includes("not found") || error.message?.toLowerCase().includes("bucket")) {
      throw new Error("Image storage is not configured. Please contact support.");
    }
    if (error.message?.toLowerCase().includes("policy") || error.message?.toLowerCase().includes("permission")) {
      throw new Error("You don't have permission to upload images. Please try signing in again.");
    }
    if (error.message?.toLowerCase().includes("size") || error.message?.toLowerCase().includes("limit")) {
      throw new Error("This image is too large. Please choose a smaller image (under 5MB).");
    }
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeImage(url: string): Promise<void> {
  if (!url) return;
  const path = extractPathFromUrl(url);
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) {
    throw new Error(`Failed to remove image: ${error.message}`);
  }
}

export function extractPathFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const bucketIdx = parts.findIndex((p) => p === BUCKET_NAME);
    if (bucketIdx === -1) return null;
    const pathParts = parts.slice(bucketIdx + 1);
    return decodeURIComponent(pathParts.join("/"));
  } catch {
    return null;
  }
}
