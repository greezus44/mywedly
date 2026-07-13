export async function generateQrDataUrl(text: string, options?: { color?: string; bgColor?: string; size?: number }): Promise<string> {
  const color = options?.color || "#000000";
  const bgColor = options?.bgColor || "#ffffff";
  const size = options?.size || 200;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${color.replace("#", "")}&bgcolor=${bgColor.replace("#", "")}`;
}

export function downloadQrCode(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadQrSvg(text: string, filename: string, options?: { color?: string; bgColor?: string }): Promise<void> {
  const color = options?.color || "#000000";
  const bgColor = options?.bgColor || "#ffffff";
  const size = 200;
  const modules = 25;
  const cellSize = size / modules;

  // Generate QR matrix using a simple API-based approach for SVG
  // We'll fetch the QR code as SVG from the API
  const svgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${color.replace("#", "")}&bgcolor=${bgColor.replace("#", "")}&format=svg`;

  try {
    const response = await fetch(svgUrl);
    const svgText = await response.text();
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    // Fallback: download as data URL
    const dataUrl = await generateQrDataUrl(text, { color, bgColor, size });
    downloadQrCode(dataUrl, filename.replace(/\.svg$/, ".png"));
  }
}
