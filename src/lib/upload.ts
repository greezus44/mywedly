import { supabase } from "./supabase";

/**
 * Compress an image file using canvas
 */
export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const outputQuality = file.type === "image/png" ? 1.0 : quality;

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Could not compress image"));
            }
          },
          outputType,
          outputQuality
        );
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload an image to the event-images storage bucket
 */
export async function uploadImage(
  file: File,
  eventId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  if (!eventId) throw new Error("Event ID is required");

  const compressed = await compressImage(file);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const path = `${eventId}/${fileName}`;

  onProgress?.(10);

  const { data, error } = await supabase.storage
    .from("event-images")
    .upload(path, compressed, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  onProgress?.(80);

  const { data: urlData } = supabase.storage
    .from("event-images")
    .getPublicUrl(data.path);

  onProgress?.(100);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

/**
 * Remove an image from storage by path
 */
export async function removeImage(path: string): Promise<void> {
  if (!path) return;
  try {
    const { error } = await supabase.storage.from("event-images").remove([path]);
    if (error) {
      console.warn("Failed to remove image:", error.message);
    }
  } catch (err) {
    console.warn("Failed to remove image:", err);
  }
}

/**
 * Extract the storage path from a public URL
 */
export function extractPathFromUrl(url: string | null | undefined): string {
  if (!url) return "";
  try {
    // Try to match the path after /event-images/
    const match = url.match(/\/event-images\/(.+)$/);
    if (match) return match[1];
    return "";
  } catch {
    return "";
  }
}
