import { supabase } from "./supabase";

const BUCKET = "event-images";

export function extractPathFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const bucketIdx = parts.indexOf(BUCKET);
    if (bucketIdx === -1 || bucketIdx === parts.length - 1) return null;
    return parts.slice(bucketIdx + 1).join("/");
  } catch {
    return null;
  }
}

export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.85,
): Promise<File> {
  // Bypass SVG entirely — return as-is
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return file;
  }

  // Non-image files pass through
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
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

      // Preserve alpha for PNGs — use PNG format for transparent images, JPEG for opaque
      const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
      const mimeType = isPng ? "image/png" : "image/jpeg";

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressed = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        mimeType,
        isPng ? undefined : quality,
      );
    };

    img.onerror = () => reject(new Error("Failed to load image for compression."));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File, userId: string): Promise<string> {
  try {
    const compressed = await compressImage(file);
    const timestamp = Date.now();
    const safeName = compressed.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    const path = `${userId}/${timestamp}-${safeName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, compressed);
    if (error) {
      console.error("Upload error:", error);
      throw new Error("Failed to upload image. Please try again.");
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    if (err instanceof Error && err.message.includes("Failed to upload image")) {
      throw err;
    }
    console.error("Upload error:", err);
    throw new Error("Failed to upload image. Please try again.");
  }
}

export async function removeImage(url: string): Promise<void> {
  const path = extractPathFromUrl(url);
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error("Remove image error:", error);
    throw new Error("Failed to remove image. Please try again.");
  }
}
