import { supabase } from "./supabase";

const BUCKET = "event-images";

export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.82,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
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
          reject(new Error("Canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to compress image"));
          },
          "image/jpeg",
          quality,
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file: File, userId: string): Promise<string> {
  const compressed = await compressImage(file);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${userId}/${crypto.randomUUID()}.${ext}`;
  const blob = new File([compressed], fileName, { type: "image/jpeg" });

  const { error } = await supabase.storage.from(BUCKET).upload(fileName, blob, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

export function extractPathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/");
    const bucketIdx = segments.indexOf(BUCKET);
    if (bucketIdx === -1 || bucketIdx === segments.length - 1) return null;
    return segments.slice(bucketIdx + 1).join("/");
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
