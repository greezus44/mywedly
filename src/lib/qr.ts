export async function generateQrDataUrl(text: string, options?: { color?: string; bgColor?: string; size?: number }): Promise<string> {
  const color = options?.color || "#000000";
  const bgColor = options?.bgColor || "#ffffff";
  const size = options?.size || 200;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${color.replace("#", "")}&bgcolor=${bgColor.replace("#", "")}`;
  return qrUrl;
}

export function downloadQrCode(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
