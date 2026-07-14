import { supabase } from "./supabase";

function getStorageBucket(): string {
  return "event-images";
}

export function extractPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const bucketIdx = parts.findIndex((p) => p === getStorageBucket());
    if (bucketIdx === -1) return null;
    return parts.slice(bucketIdx + 1).join("/");
  } catch {
    return null;
  }
}

export async function compressImage(
  file: File,
  maxSize = 1600,
  quality = 0.85,
): Promise<File> {
  // Bypass SVG entirely — return as-is
  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height / width) * maxSize);
            width = maxSize;
          } else {
            width = Math.round((width / height) * maxSize);
            height = maxSize;
          }
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

        // Check if the image has transparency (PNG with alpha)
        const hasAlpha = file.type === "image/png";
        const useFormat = hasAlpha ? "image/png" : "image/jpeg";

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not compress image"));
              return;
            }
            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, useFormat === "image/png" ? ".png" : ".jpg"), {
              type: useFormat,
            });
            resolve(compressed);
          },
          useFormat,
          useFormat === "image/jpeg" ? quality : undefined,
        );
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(
  file: File,
  folder: string,
  eventId: string,
): Promise<{ url: string; path: string } | null> {
  try {
    const compressed = await compressImage(file);
    const ext = compressed.name.split(".").pop() || "jpg";
    const fileName = `${eventId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage
      .from(getStorageBucket())
      .upload(fileName, compressed, {
        cacheControl: "3600",
        upsert: false,
      });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from(getStorageBucket())
      .getPublicUrl(data.path);
    return { url: urlData.publicUrl, path: data.path };
  } catch (err) {
    console.error("Upload failed:", err);
    return null;
  }
}

export async function removeImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(getStorageBucket()).remove([path]);
    if (error) {
      console.error("Remove error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Remove failed:", err);
    return false;
  }
}
