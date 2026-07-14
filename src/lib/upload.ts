import { supabase } from "./supabase";

const BUCKET = "event-images";

function isSvg(file: File | Blob): boolean {
  if (file instanceof File) {
    return file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
  }
  return file.type === "image/svg+xml";
}

function hasAlpha(file: File | Blob): Promise<boolean> {
  return new Promise((resolve) => {
    if (file.type === "image/png" || file.type === "image/webp" || file.type === "image/gif") {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(false);
          return;
        }
        ctx.drawImage(img, 0, 0);
        try {
          const data = ctx.getImageData(0, 0, Math.min(canvas.width, 1), Math.min(canvas.height, 1)).data;
          resolve(data[3] < 255);
        } catch {
          resolve(false);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      img.src = url;
    } else {
      resolve(false);
    }
  });
}

export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.82
): Promise<File> {
  // Bypass SVG entirely — it's vector, not raster
  if (isSvg(file)) {
    return file;
  }

  const hasTransparency = await hasAlpha(file);
  // Use PNG format for transparent images, only JPEG for opaque
  const outputType = hasTransparency ? "image/png" : "image/jpeg";

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = Math.round(maxWidth);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // For JPEG, fill white background to avoid black on transparency
      if (outputType === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, hasTransparency ? ".png" : ".jpg"), {
            type: outputType,
          });
          resolve(compressed);
        },
        outputType,
        outputType === "image/jpeg" ? quality : undefined
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

export async function uploadImage(
  file: File,
  eventFolder: string,
  prefix = "img"
): Promise<string> {
  const compressed = await compressImage(file);
  const ext = compressed.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${eventFolder}/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function extractPathFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/");
    const bucketIdx = parts.indexOf(BUCKET);
    if (bucketIdx === -1) return null;
    return parts.slice(bucketIdx + 1).join("/");
  } catch {
    return null;
  }
}

export async function removeImage(url: string): Promise<void> {
  const path = extractPathFromUrl(url);
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
