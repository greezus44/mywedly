import { supabase } from "./supabase";

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 0.82;

export function compressImage(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<Blob> {
  const { maxWidth = MAX_WIDTH, maxHeight = MAX_HEIGHT, quality = QUALITY } = options;

  return new Promise((resolve, reject) => {
    if (file.type === "image/gif" || file.type === "image/svg+xml") {
      resolve(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Check if the source image has transparency (alpha channel)
        // Sample the alpha channel of pixels to detect transparency
        const hasTransparency = checkTransparency(ctx, width, height);

        // Preserve alpha channel: use PNG for images with transparency.
        // Only convert to JPEG if the image has NO transparency AND is large
        // enough to benefit from JPEG compression.
        const isLargeEnough = width * height > 50000; // ~200x250 threshold

        if (hasTransparency || !isLargeEnough) {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to compress image (png)"));
            },
            "image/png"
          );
        } else {
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to compress image (jpeg)"));
            },
            "image/jpeg",
            quality
          );
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function checkTransparency(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): boolean {
  try {
    // Sample pixels across the image to detect any alpha < 255
    const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 50));
    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        if (pixel[3] < 255) return true;
      }
    }
    // Also check corners more thoroughly
    const corners = [
      [0, 0],
      [width - 1, 0],
      [0, height - 1],
      [width - 1, height - 1],
    ];
    for (const [cx, cy] of corners) {
      const pixel = ctx.getImageData(cx, cy, 1, 1).data;
      if (pixel[3] < 255) return true;
    }
    return false;
  } catch {
    // If we can't read pixels (e.g., tainted canvas), assume no transparency
    return false;
  }
}

export async function uploadImage(
  file: File,
  eventId: string,
  options: { compress?: boolean } = {}
): Promise<string> {
  const { compress = true } = options;
  let blob: Blob = file;

  if (compress) {
    blob = await compressImage(file);
  }

  const ext = blob.type === "image/png" ? "png" : "jpg";
  const fileName = `${eventId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("event-images")
    .upload(fileName, blob, {
      contentType: blob.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data } = supabase.storage
    .from("event-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function removeImage(url: string): Promise<void> {
  const path = extractPathFromUrl(url);
  if (!path) return;

  const { error } = await supabase.storage
    .from("event-images")
    .remove([path]);

  if (error) {
    throw new Error(`Remove failed: ${error.message}`);
  }
}

export function extractPathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    // Find the bucket name and take everything after it
    const bucketIdx = parts.indexOf("event-images");
    if (bucketIdx === -1) return null;
    return parts.slice(bucketIdx + 1).join("/");
  } catch {
    return null;
  }
}
