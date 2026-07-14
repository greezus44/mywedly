import { supabase } from "./supabase";

const BUCKET_NAME = "event-images";

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compress an image file using canvas. Preserves alpha channel for PNGs.
 * SVG files are passed through unchanged (no compression).
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.82 } = options;

  // Bypass SVG — return as-is
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return file;
  }

  // Non-image files: return as-is
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const img = new Image();
  const objectUrl = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = objectUrl;
    });

    let { width, height } = img;

    // Scale down if needed
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }

    ctx.drawImage(img, 0, 0, width, height);

    // Preserve alpha for PNGs; use JPEG for others
    const isPng = file.type === "image/png";
    const mimeType = isPng ? "image/png" : "image/jpeg";
    const qualityArg = isPng ? undefined : quality;

    return new Promise<File>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }
          const compressed = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        mimeType,
        qualityArg
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Upload an image to the event-images bucket.
 * Path: `${userId}/${timestamp}-${filename}`
 * Returns the public URL of the uploaded image.
 */
export async function uploadImage(
  file: File,
  userId: string
): Promise<string> {
  if (!userId) {
    throw new Error("You must be signed in to upload images.");
  }

  const compressed = await compressImage(file);
  const timestamp = Date.now();
  const safeName = compressed.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${userId}/${timestamp}-${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, compressed, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("row-level security") || msg.includes("policy")) {
      throw new Error("You don't have permission to upload images. Please sign in and try again.");
    }
    if (msg.includes("bucket") || msg.includes("not found")) {
      throw new Error("Image storage is not configured. Please contact support.");
    }
    if (msg.includes("size") || msg.includes("too large")) {
      throw new Error("This image is too large. Please choose a smaller image (max 10MB).");
    }
    throw new Error("Failed to upload image. Please try again.");
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * Remove an image from storage by its public URL.
 */
export async function removeImage(publicUrl: string): Promise<void> {
  const path = extractPathFromUrl(publicUrl);
  if (!path) return;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    throw new Error("Failed to remove image. It may have already been deleted.");
  }
}

/**
 * Extract the storage path from a public URL.
 * Given `https://<project>.supabase.co/storage/v1/object/public/event-images/userId/123-file.jpg`
 * returns `userId/123-file.jpg`.
 */
export function extractPathFromUrl(publicUrl: string): string | null {
  if (!publicUrl) return null;
  try {
    const url = new URL(publicUrl);
    const parts = url.pathname.split("/");
    const bucketIdx = parts.indexOf(BUCKET_NAME);
    if (bucketIdx === -1 || bucketIdx + 1 >= parts.length) return null;
    return parts.slice(bucketIdx + 1).join("/");
  } catch {
    return null;
  }
}
