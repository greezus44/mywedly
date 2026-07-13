import QRCode from "qrcode";

export async function generateQrDataUrl(text: string, options?: { color?: { dark?: string; light?: string }; width?: number }): Promise<string> {
  return QRCode.toDataURL(text, {
    width: options?.width || 200,
    color: { dark: options?.color?.dark || "#000000", light: options?.color?.light || "#ffffff" },
    margin: 2,
  });
}

export function downloadQrCode(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
