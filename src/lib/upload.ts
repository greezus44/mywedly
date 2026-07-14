import { supabase } from "./supabase";

/** CRITICAL: The storage bucket name for event images. */
const BUCKET_NAME = "event-images";

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compress an image file using a canvas. Preserves alpha transparency for PNGs
 * and bypasses compression entirely for SVG files (returns them as-is).
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxWidth = 2000, maxHeight = 2000, quality = 0.85 } = options;

  // SVGs are vector — return as-is to preserve scalability and small size.
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return file;
  }

  // Non-raster types we can't process — return as-is.
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
  if (height > maxHeight) {
    width = Math.round((width * maxHeight) / height);
    height = maxHeight;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  // Preserve alpha for PNGs; use white background for JPEGs.
  const isPng = file.type === "image/png";
  if (!isPng && file.type !== "image/webp") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  const outputType = isPng ? "image/png" : "image/jpeg";
  const outputQuality = isPng ? undefined : quality;

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to compress image"));
      },
      outputType,
      outputQuality
    );
  });

  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const ext = isPng ? ".png" : ".jpg";
  const compressedName = `${baseName}${ext}`;

  return new File([blob], compressedName, { type: outputType });
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Upload an image to the `event-images` bucket.
 * Path: `${userId}/${timestamp}-${filename}`
 * Returns the public URL of the uploaded file.
 */
export async function uploadImage(
  file: File,
  userId: string
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    if (!userId) {
      return { error: "You must be signed in to upload images." };
    }

    const compressed = await compressImage(file);
    const timestamp = Date.now();
    const safeName = compressed.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${userId}/${timestamp}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, compressed, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { error: friendlyUploadError(uploadError) };
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    return { url: data.publicUrl, path };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Something went wrong while uploading your image.",
    };
  }
}

function friendlyUploadError(error: { message?: string; statusCode?: string }): string {
  const msg = error.message || "";
  if (error.statusCode === "403" || msg.includes("row-level security") || msg.includes("policy")) {
    return "You don't have permission to upload images. Please sign in and try again.";
  }
  if (error.statusCode === "404" || msg.includes("not found")) {
    return "Image storage is not available. Please contact support.";
  }
  if (msg.includes("duplicate") || msg.includes("already exists")) {
    return "This image has already been uploaded. Please try a different file.";
  }
  return "We couldn't upload your image. Please try again.";
}

/**
 * Remove an image from the `event-images` bucket by its storage path.
 */
export async function removeImage(
  path: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to remove image.",
    };
  }
}

/**
 * Extract the storage path from a public URL.
 * Given `https://<project>.supabase.co/storage/v1/object/public/event-images/userId/123-file.jpg`
 * returns `userId/123-file.jpg`.
 */
export function extractPathFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/");
    const bucketIdx = parts.indexOf(BUCKET_NAME);
    if (bucketIdx === -1 || bucketIdx === parts.length - 1) return null;
    return parts.slice(bucketIdx + 1).join("/");
  } catch {
    return null;
  }
}
