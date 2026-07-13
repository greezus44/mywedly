import QRCode from "qrcode";

export async function generateQRDataURL(text: string, opts?: { width?: number; color?: string; bg?: string }): Promise<string> {
  return QRCode.toDataURL(text, {
    width: opts?.width || 256,
    color: { dark: opts?.color || "#000000", light: opts?.bg || "#FFFFFF" },
    margin: 2,
  });
}

export async function generateQRSVG(text: string, opts?: { width?: number; color?: string; bg?: string }): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    width: opts?.width || 256,
    color: { dark: opts?.color || "#000000", light: opts?.bg || "#FFFFFF" },
    margin: 2,
  });
}

export async function downloadQRPNG(text: string, filename: string): Promise<void> {
  const url = await generateQRDataURL(text, { width: 512 });
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export async function downloadQRSVG(text: string, filename: string): Promise<void> {
  const svg = await generateQRSVG(text, { width: 512 });
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadQRHighRes(text: string, filename: string, size = 1024): Promise<void> {
  const url = await generateQRDataURL(text, { width: size });
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function getShareUrl(slug: string): string {
  return `${window.location.origin}/w/${slug}`;
}

export async function downloadAllGuestQRsAsZip(guests: { id: string; name: string; username: string }[], shareUrl: string): Promise<void> {
  const [{ default: JSZip }] = await Promise.all([import("jszip")]);
  const zip = new JSZip();
  for (const g of guests) {
    const url = `${shareUrl}?t=${g.username}`;
    const dataUrl = await generateQRDataURL(url, { width: 512 });
    const base64 = dataUrl.split(",")[1];
    zip.file(`${g.name.replace(/\s+/g, "_")}.png`, base64, { base64: true });
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "guest-qr-codes.zip";
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadAllGuestQRsAsPDF(guests: { id: string; name: string; username: string }[], shareUrl: string): Promise<void> {
  const [{ default: jsPDF }] = await Promise.all([import("jspdf")]);
  const pdf = new jsPDF();
  for (let i = 0; i < guests.length; i++) {
    const g = guests[i];
    const url = `${shareUrl}?t=${g.username}`;
    const dataUrl = await generateQRDataURL(url, { width: 256 });
    if (i > 0) pdf.addPage();
    pdf.addImage(dataUrl, "PNG", 65, 40, 80, 80);
    pdf.setFontSize(14);
    pdf.text(g.name, 105, 135, { align: "center" });
  }
  pdf.save("guest-qr-codes.pdf");
}
