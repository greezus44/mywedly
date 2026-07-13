/**
 * Generate a QR code as a data URL using the qrserver.com API.
 */
export async function generateQrDataUrl(
  text: string,
  size = 256,
): Promise<string> {
  if (!text) throw new Error("Text is required to generate a QR code");
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    text,
  )}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to generate QR code");
  }

  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Download a QR code as a PNG file.
 */
export async function downloadQrCode(text: string, filename: string): Promise<void> {
  const dataUrl = await generateQrDataUrl(text);
  triggerDownload(dataUrl, filename);
}

/**
 * Download a QR code as an SVG file.
 */
export async function downloadQrSvg(text: string, filename: string): Promise<void> {
  if (!text) throw new Error("Text is required to generate a QR code");
  const size = 256;
  const encoded = encodeURIComponent(text);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <image width="${size}" height="${size}" href="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&amp;data=${encoded}" />
</svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
