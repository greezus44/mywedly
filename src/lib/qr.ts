/**
 * Generate a QR code as a data URL using the qrserver.com API
 */
export async function generateQrDataUrl(
  text: string,
  size = 256
): Promise<string> {
  if (!text) return "";
  const encoded = encodeURIComponent(text);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to generate QR code");
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read QR blob"));
      reader.readAsDataURL(blob);
    });
  } catch {
    // Fallback: return the URL directly so it can be used as an img src
    return url;
  }
}

/**
 * Download a QR code as a PNG image
 */
export async function downloadQrCode(text: string, filename: string): Promise<void> {
  if (!text) return;
  const dataUrl = await generateQrDataUrl(text, 512);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename || "qr-code.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download a QR code as an SVG
 */
export async function downloadQrSvg(text: string, filename: string): Promise<void> {
  if (!text) return;
  const encoded = encodeURIComponent(text);
  const svgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&format=svg&data=${encoded}`;

  try {
    const response = await fetch(svgUrl);
    if (!response.ok) throw new Error("Failed to generate SVG");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "qr-code.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    // Fallback: open in new tab
    window.open(svgUrl, "_blank");
  }
}
