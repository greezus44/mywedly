import QRCode from "qrcode";

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
}

export async function downloadQrCode(url: string, filename = "qr-code.png"): Promise<void> {
  const dataUrl = await generateQrDataUrl(url);
  const link = document.createElement("a");
  link.href = dataUrl; link.download = filename; link.click();
}

export async function downloadQrSvg(url: string, filename = "qr-code.svg"): Promise<void> {
  const svg = await QRCode.toString(url, { type: "svg", margin: 2 });
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const dataUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = dataUrl; link.download = filename; link.click();
  URL.revokeObjectURL(dataUrl);
}
