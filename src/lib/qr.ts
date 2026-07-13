import QRCode from "qrcode";
import JSZip from "jszip";

export async function generateQRDataURL(text: string, options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }): Promise<string> {
  return QRCode.toDataURL(text, {
    width: options?.width || 256,
    margin: options?.margin || 2,
    color: { dark: options?.color?.dark || "#000000", light: options?.color?.light || "#ffffff" },
    errorCorrectionLevel: "H",
  });
}

export async function generateQRSVG(text: string, options?: { width?: number; margin?: number; color?: { dark?: string; light?: string } }): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    width: options?.width || 256,
    margin: options?.margin || 2,
    color: { dark: options?.color?.dark || "#000000", light: options?.color?.light || "#ffffff" },
    errorCorrectionLevel: "H",
  });
}

export async function downloadQRPNG(text: string, filename: string, width = 512): Promise<void> {
  const dataUrl = await generateQRDataURL(text, { width });
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export async function downloadQRSVG(text: string, filename: string, width = 512): Promise<void> {
  const svg = await generateQRSVG(text, { width });
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadQRHighRes(text: string, filename: string, width = 1024): Promise<void> {
  await downloadQRPNG(text, filename, width);
}

export async function downloadAllGuestQRsAsZip(
  items: { guestName: string; token: string }[],
  filename: string,
  urlBuilder: (token: string) => string
): Promise<void> {
  const zip = new JSZip();
  for (const item of items) {
    const dataUrl = await generateQRDataURL(urlBuilder(item.token), { width: 512 });
    const base64 = dataUrl.split(",")[1];
    const safeName = item.guestName.replace(/[^a-zA-Z0-9]/g, "_");
    zip.file(`${safeName}_QR.png`, base64, { base64: true });
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadAllGuestQRsAsPDF(
  items: { guestName: string; token: string }[],
  filename: string,
  urlBuilder: (token: string) => string
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  let y = 20;
  for (const item of items) {
    if (y > 250) { pdf.addPage(); y = 20; }
    const dataUrl = await generateQRDataURL(urlBuilder(item.token), { width: 256 });
    pdf.addImage(dataUrl, "PNG", 20, y, 60, 60);
    pdf.setFontSize(12);
    pdf.text(item.guestName, 90, y + 30);
    y += 70;
  }
  pdf.save(filename);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getShareUrl(platform: string, url: string, text: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  switch (platform) {
    case "whatsapp": return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    case "telegram": return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case "facebook": return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "messenger": return `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=0`;
    case "twitter": return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    case "email": return `mailto:?subject=${encodedText}&body=${encodedUrl}`;
    case "sms": return `sms:?&body=${encodedText}%20${encodedUrl}`;
    default: return url;
  }
}
